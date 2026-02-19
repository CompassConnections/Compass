import {Row, run, SupabaseClient} from 'common/supabase/utils'
import {User} from 'common/user'
import {OptionTableKey} from 'common/profiles/constants'

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

  // Fetch interests
  const interestsRes = await run(
    db.from('profile_interests').select('interests(name, id)').eq('profile_id', profile.id),
  )
  const interests = interestsRes.data?.map((row: any) => String(row.interests.id)) || []

  // Fetch causes
  const causesRes = await run(
    db.from('profile_causes').select('causes(name, id)').eq('profile_id', profile.id),
  )
  const causes = causesRes.data?.map((row: any) => String(row.causes.id)) || []

  // Fetch causes
  const workRes = await run(
    db.from('profile_work').select('work(name, id)').eq('profile_id', profile.id),
  )
  const work = workRes.data?.map((row: any) => String(row.work.id)) || []

  // console.debug({work, interests, causes})

  return {
    ...profile,
    interests,
    causes,
    work,
  }
}
