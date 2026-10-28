import {DONATION_SELECT, DonationQueryRow, toAdminDonation} from 'api/helpers/donations'
import {APIHandler} from 'api/helpers/endpoint'
import {ADMIN_DONATIONS_LIMIT} from 'common/donations'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/** Every donation, newest first, for /admin/donations. Totals are summed client-side. */
export const getDonationsAdmin: APIHandler<'get-donations-admin'> = async (_props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const pg = createSupabaseDirectClient()

  const rows = await pg.manyOrNone<DonationQueryRow>(
    `${DONATION_SELECT}
     order by d.donated_at desc, d.id desc
     limit $(limit)`,
    {limit: ADMIN_DONATIONS_LIMIT},
  )

  return {donations: rows.map(toAdminDonation)}
}
