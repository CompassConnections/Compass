import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {getReferredMembers} from 'shared/outreach/referrals'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Who this member has brought to Compass.
 *
 * Attribution is stored against the referrer's *username*, not their id, because that is what travels
 * in the share link. A member who renames themselves therefore loses credit for earlier referrals —
 * worth knowing, and not worth fixing by rewriting history on rename.
 */
export const getMyReferrals: APIHandler<'get-my-referrals'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()

  const me = await pg.oneOrNone<{username: string}>(`select username from users where id = $1`, [
    auth.uid,
  ])
  if (!me) throw APIErrors.notFound('User not found')

  const members = await getReferredMembers(me.username, pg)
  return {count: members.length, members}
}
