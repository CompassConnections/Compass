import {debug} from 'common/logger'
import {ProfileRow} from 'common/profiles/profile'
import {convertUser} from 'common/supabase/users'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {type APIHandler} from './helpers/endpoint'

export async function getUserAndProfile(username: string) {
  const pg = createSupabaseDirectClient()

  const user = await pg.oneOrNone('SELECT * FROM users WHERE username ILIKE $1', [username], (r) =>
    r ? convertUser(r) : null,
  )
  if (!user) return null

  // Fetch profile like getProfileRow does
  const profileRes = await pg.oneOrNone<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [
    user.id,
  ])

  if (!profileRes) return {user, profile: null}

  // Parallel instead of sequential (like getProfileRow does in frontend)
  const [interestsRes, causesRes, workRes] = await Promise.all([
    pg.any(
      `SELECT interests.id 
            FROM profile_interests 
            JOIN interests ON profile_interests.option_id = interests.id 
            WHERE profile_interests.profile_id = $1`,
      [profileRes.id],
    ),
    pg.any(
      `SELECT causes.id 
            FROM profile_causes 
            JOIN causes ON profile_causes.option_id = causes.id 
            WHERE profile_causes.profile_id = $1`,
      [profileRes.id],
    ),
    pg.any(
      `SELECT work.id 
            FROM profile_work 
            JOIN work ON profile_work.option_id = work.id 
            WHERE profile_work.profile_id = $1`,
      [profileRes.id],
    ),
  ])

  const profileWithItems = {
    ...profileRes,
    interests: interestsRes.map((r: any) => String(r.id)),
    causes: causesRes.map((r: any) => String(r.id)),
    work: workRes.map((r: any) => String(r.id)),
  }

  return {user, profile: profileWithItems}
}

export const getUserAndProfileHandler: APIHandler<'get-user-and-profile'> = async (
  {username},
  _auth,
) => {
  const result = await getUserAndProfile(username)
  debug(result)
  return {
    user: result?.user,
    profile: result?.profile,
  }
}
