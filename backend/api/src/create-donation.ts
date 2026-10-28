import {DONATION_SELECT, DonationQueryRow, toAdminDonation} from 'api/helpers/donations'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {dollarsToCents} from 'common/donations'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Record a donation by hand.
 *
 * Admins only, not mods: this puts a dollar figure on a member's public profile, which is a
 * publishing decision of the same kind as a spotlight. The member keeps the last word through
 * `profiles.donor_badge_hidden`, but the admin page asks them to check with the donor first, because
 * a badge that appears unasked and then has to be found and switched off is a worse experience than
 * one that was expected.
 *
 * `donatedAt` defaults to now; backdating is allowed because the badge window depends on it and
 * receipts are rarely typed in the day they arrive. The future is not: a gift dated next month would
 * show for thirteen months.
 */
export const createDonation: APIHandler<'create-donation'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const {userId, amountUsd, donatedAt, note} = props

  const amountCents = dollarsToCents(amountUsd)
  if (amountCents <= 0) throw APIErrors.badRequest('A donation has to be at least one cent')
  if (donatedAt && donatedAt.getTime() > Date.now()) {
    throw APIErrors.badRequest('A donation cannot be dated in the future')
  }

  const pg = createSupabaseDirectClient()

  return await pg.tx(async (tx) => {
    const user = await tx.oneOrNone<{id: string}>(`select id from users where id = $(userId)`, {
      userId,
    })
    if (!user) throw APIErrors.notFound('No such member')

    const inserted = await tx.one<{id: string}>(
      `insert into donations (user_id, amount_cents, donated_at, note, admin_id)
       values ($(userId), $(amountCents), coalesce($(donatedAt), now()), $(note), $(adminId))
       returning id`,
      {
        userId,
        amountCents,
        donatedAt: donatedAt ?? null,
        note: note?.trim() || null,
        adminId: auth.uid,
      },
    )

    const row = await tx.one<DonationQueryRow>(`${DONATION_SELECT} where d.id = $(id)`, {
      id: inserted.id,
    })

    return {donation: toAdminDonation(row)}
  })
}
