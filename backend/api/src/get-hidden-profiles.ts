import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getHiddenProfiles: APIHandler<'get-hidden-profiles'> = async (
  {limit = 100, offset = 0},
  auth
) => {
  const pg = createSupabaseDirectClient()

  // Count total hidden for pagination info
  const countRes = await pg.one<{ count: string }>(
    `select count(*)::text as count
     from hidden_profiles
     where hider_user_id = $1`,
    [auth.uid]
  )
  const count = Number(countRes.count) || 0

  // Fetch hidden users joined with users table for display
  const rows = await pg.map(
    `select u.id, u.name, u.username, u.data ->> 'avatarUrl' as "avatarUrl", hp.created_time as "createdTime"
     from hidden_profiles hp
              join users u on u.id = hp.hidden_user_id
     where hp.hider_user_id = $1
     order by hp.created_time desc
     limit $2 offset $3`,
    [auth.uid, limit, offset],
    (r: any) => ({
      id: r.id as string,
      name: r.name as string,
      username: r.username as string,
      avatarUrl: r.avatarUrl as string | null | undefined,
      createdTime: r.createdTime as string | undefined,
    })
  )

  return {status: 'success', hidden: rows, count}
}
