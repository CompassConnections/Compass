import {OptionTableKey} from 'common/profiles/constants'
import {Row, run, SupabaseClient} from 'common/supabase/utils'
import {User} from 'common/user'

export type ProfileRow = Row<'profiles'>
export type ProfileWithoutUser = ProfileRow & {[K in OptionTableKey]?: string[]}
export type Profile = ProfileWithoutUser & {user: User}

export const getProfileRow = async (
  userId: string,
  db: SupabaseClient,
): Promise<ProfileWithoutUser | null> => {
  // Fetch profile
  const profileRes = await run(db.from('profiles').select('*').eq('user_id', userId))
  const profile = profileRes.data?.[0]
  if (!profile) return null

  // Parallel instead of sequential
  const [interestsRes, causesRes, workRes] = await Promise.all([
    run(db.from('profile_interests').select('interests(name, id)').eq('profile_id', profile.id)),
    run(db.from('profile_causes').select('causes(name, id)').eq('profile_id', profile.id)),
    run(db.from('profile_work').select('work(name, id)').eq('profile_id', profile.id)),
  ])

  const result = {
    ...profile,
    interests: interestsRes.data?.map((r: any) => String(r.interests.id)) ?? [],
    causes: causesRes.data?.map((r: any) => String(r.causes.id)) ?? [],
    work: workRes.data?.map((r: any) => String(r.work.id)) ?? [],
  }

  // console.debug(result)

  return result
}
