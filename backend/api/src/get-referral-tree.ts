import {APIHandler} from 'api/helpers/endpoint'
import {getReferralTree} from 'shared/outreach/referrals'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The constellation behind /referrals: everyone who is on Compass because of the caller.
 *
 * Keyed on `auth.uid` and nothing else. The older `get-my-referrals` had to look the caller's username
 * up first because its edge was username-shaped; this one walks ids the whole way down, so the
 * authenticated id *is* the root and there is nothing to resolve. That also means a member who renames
 * keeps their whole sky, which the username walk could not promise.
 *
 * Nothing is filtered out of the tree. Disabled and banned members stay in it — the existing rule that
 * credit is for the introduction, which happened, applies just as much at depth 4 as at depth 1, and
 * pruning them would silently detach every member below them. `visibility = 'member'` profiles stay in
 * it too: this endpoint is authed, so the caller is exactly the audience that visibility admits.
 */
export const getReferralTreeHandler: APIHandler<'get-referral-tree'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()
  return await getReferralTree(auth.uid, pg)
}
