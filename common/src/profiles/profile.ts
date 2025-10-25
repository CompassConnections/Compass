import { Row, run, SupabaseClient } from 'common/supabase/utils'
import { User } from 'common/user'

export type ProfileRow = Row<'profiles'>
export type Profile = ProfileRow & { user: User }
export const getProfileRow = async (userId: string, db: SupabaseClient) => {
  // console.debug('getProfileRow', userId)
  const res = await run(db.from('profiles').select('*').eq('user_id', userId))
  return res.data[0]
}
