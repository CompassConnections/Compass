import {DisplayUser} from 'common/api/user-types'
import {convertPartialUser} from 'common/supabase/users'
import {run} from 'common/supabase/utils'
import {api} from 'web/lib/api'
import {db} from 'web/lib/supabase/db'

// `_userId` is only there to key the cache on the signed-in member, so switching accounts refetches.
// The stars are always the caller's own: who someone has saved is private, so the API takes no member
// id (the get_profile_stars() function this replaced took any member's id on the anon key).
export const getStars = async (_userId: string) => {
  const {targetIds: ids} = await api('get-my-stars', {})
  if (!ids.length) return []

  // Direct SELECT on `users` is revoked from the anon/authenticated roles (bulk-read cap); go through
  // the capped get_display_users() function.
  const {data: users} = await run(db.rpc('get_display_users' as any, {ids}))

  return (users as any[]).map(convertPartialUser) as unknown as DisplayUser[]
}
