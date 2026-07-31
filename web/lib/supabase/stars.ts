import {DisplayUser} from 'common/api/user-types'
import {convertPartialUser} from 'common/supabase/users'
import {run} from 'common/supabase/utils'
import {db} from 'web/lib/supabase/db'

export const getStars = async (creatorId: string) => {
  // Direct SELECT on profile_stars is revoked from the anon/authenticated roles; read this creator's
  // stars through the capped get_profile_stars() SECURITY DEFINER function (ordered newest-first).
  const {data} = await run(db.rpc('get_profile_stars' as any, {creator: creatorId}))

  if (!data) return []

  const ids = (data as any[]).map((d) => d.target_id as string)
  // Direct SELECT on `users` is revoked from the anon/authenticated roles (bulk-read cap); go through
  // the capped get_display_users() function.
  const {data: users} = await run(db.rpc('get_display_users' as any, {ids}))

  return (users as any[]).map(convertPartialUser) as unknown as DisplayUser[]
}
