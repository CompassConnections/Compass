import {APIHandler} from 'api/helpers/endpoint'
import {getReferralLeaderboard} from 'shared/outreach/referrals'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Who has personally brought the most people, and where the caller stands.
 *
 * Direct referrals only — see the note on `ReferralLeaderboardEntry` for why the recursive total would
 * make a worse contest. Everything else, including the caller's own row when they are nowhere near the
 * top, is decided in one statement inside `getReferralLeaderboard`.
 *
 * Unauthed, so `auth` is undefined for an anonymous reader. That is passed straight down rather than
 * rejected: it is what drops the `you` row and redacts the photos of members-only profiles, under the
 * same rule `get-user-and-profile` applies.
 */
export const getReferralLeaderboardHandler: APIHandler<'get-referral-leaderboard'> = async (
  props,
  auth,
) => {
  const pg = createSupabaseDirectClient()
  return await getReferralLeaderboard(auth?.uid, props.limit, pg)
}
