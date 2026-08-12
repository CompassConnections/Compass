import {BirthDateString} from 'common/profiles/birth-date'
import {OptionTableKey} from 'common/profiles/constants'
import {Row, run, SupabaseClient} from 'common/supabase/utils'
import {User} from 'common/user'

/**
 * `birth_date` is spelled out rather than left to the generated row type so this compiles against a
 * `schema.ts` regenerated either side of the birth-date migration. Drop the intersection once
 * `regen-types-dev` has run against a database that has the column.
 *
 * `age` stays on the row — it is a column, kept in step with `birth_date` by the database (see
 * `common/profiles/birth-date`), so reads are unchanged and nothing outside the form writes it.
 */
export type ProfileRow = Row<'profiles'> & {birth_date?: BirthDateString | null}
export type ProfileWithoutUser = ProfileRow & {[K in OptionTableKey]?: string[]}
export type Profile = ProfileWithoutUser & {
  user: User
  /**
   * Plain-text, truncated `bio`. List endpoints that only ever render a snippet send this instead of
   * the full rich-text `bio` document — see the `card` projection in the backend's `get-profiles`.
   * When it is set, `bio` is absent.
   */
  bio_snippet?: string
}

export const getProfileRowWithFrontendSupabase = async (
  userId: string,
  db: SupabaseClient,
): Promise<ProfileWithoutUser | null> => {
  // Do not use this method when running server-side (like in getStaticProps),
  // use the direct connection through the API via getProfileRow instead.

  // Fetch profile. Direct SELECT on `profiles` is revoked from the anon/authenticated roles (bulk-read
  // cap); reads go through the capped get_profile_by_user_id() SECURITY DEFINER function instead.
  const profileRes = await run(db.rpc('get_profile_by_user_id' as any, {uid: userId}))
  const profile = profileRes.data?.[0] as ProfileRow | undefined
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
