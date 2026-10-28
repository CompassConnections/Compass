import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The one number the supporter badge draws: a member's donations over the trailing 365 days.
 *
 * Public and CDN-cached (see the schema entry), so it must never say more than the badge does. It
 * answers zero for a member who opted out, for one with nothing in the window, and for an unknown
 * id alike — a caller cannot tell those apart, which is the point: "hidden" is not a thing a profile
 * visitor gets to learn either.
 *
 * The window is computed here and not stored anywhere, so a badge lapses on its own a year after the
 * last gift. The same rule lives in `sumPastYearCents` for the admin page; keep the two in step.
 */
export const getDonorBadge: APIHandler<'get-donor-badge'> = async ({userId}) => {
  const pg = createSupabaseDirectClient()

  const row = await pg.oneOrNone<{amount_cents: string}>(
    `select coalesce(sum(d.amount_cents), 0) as amount_cents
     from donations d
     join profiles p on p.user_id = d.user_id
     where d.user_id = $(userId)
       and d.donated_at > now() - interval '365 days'
       and not p.donor_badge_hidden`,
    {userId},
  )

  return {amountCents: Number(row?.amount_cents ?? 0)}
}
