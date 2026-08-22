import {APIHandler} from 'api/helpers/endpoint'
import {getReferralCounts} from 'shared/outreach/referrals'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The number behind the sidebar's "Invite" badge.
 *
 * A separate endpoint from `get-referral-tree` rather than a field on it, because this one is asked
 * on every page a signed-in member opens and that one is asked once, when they go looking. Sharing an
 * endpoint would mean every page load paying for a walk that joins every descendant against `users`
 * and returns them, to render two characters.
 */
export const getMyReferralCount: APIHandler<'get-my-referral-count'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()
  return await getReferralCounts(auth.uid, pg)
}
