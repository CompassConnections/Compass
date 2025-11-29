import {areGenderCompatible} from 'common/profiles/compatibility-util'
import {type Profile, type ProfileRow} from 'common/profiles/profile'
import {type User} from 'common/user'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export type ProfileAndUserRow = ProfileRow & {
  name: string
  username: string
  user: any
}

export function convertRow(row: ProfileAndUserRow): Profile
export function convertRow(row: ProfileAndUserRow | undefined): Profile | null {
  if (!row) return null

  // Remove internal/search-only fields from the returned profile row
  const profile: any = {
    ...row,
    user: {...row.user, name: row.name, username: row.username} as User,
  }
  delete profile.bio_text
  delete profile.bio_tsv
  return profile as Profile
}

const PROFILE_COLS = 'profiles.*, name, username, users.data as user'

export const getProfile = async (userId: string) => {
  const pg = createSupabaseDirectClient()
  return await pg.oneOrNone(
    `
        select ${PROFILE_COLS}
        from profiles
                 join
             users on users.id = profiles.user_id
        where user_id = $1
    `,
    [userId],
    convertRow
  )
}

export const getProfiles = async (userIds: string[]) => {
  const pg = createSupabaseDirectClient()
  return await pg.map(
    `
        select ${PROFILE_COLS}
        from profiles
                 join
             users on users.id = profiles.user_id
        where user_id = any ($1)
    `,
    [userIds],
    convertRow
  )
}

export const getGenderCompatibleProfiles = async (profile: ProfileRow) => {
  const pg = createSupabaseDirectClient()
  const profiles = await pg.map(
    `
        select ${PROFILE_COLS}
        from profiles
                 join
             users on users.id = profiles.user_id
        where user_id != $(user_id)
          and looking_for_matches
          and (data ->> 'isBannedFromPosting' != 'true' or data ->> 'isBannedFromPosting' is null)
          and (data ->> 'userDeleted' != 'true' or data ->> 'userDeleted' is null)
          and profiles.pinned_url is not null
    `,
    {...profile},
    convertRow
  )
  return profiles.filter((l: Profile) => areGenderCompatible(profile, l))
}

export const getCompatibleProfiles = async (
  profile: ProfileRow,
  radiusKm: number | undefined
) => {
  const pg = createSupabaseDirectClient()
  return await pg.map(
    `
        select ${PROFILE_COLS}
        from profiles
                 join
             users on users.id = profiles.user_id
        where user_id != $(user_id)
          and looking_for_matches
          and (data ->> 'isBannedFromPosting' != 'true' or data ->> 'isBannedFromPosting' is null)
          and (data ->> 'userDeleted' != 'true' or data ->> 'userDeleted' is null)

          -- Gender
          and (profiles.gender = any ($(pref_gender)) or profiles.gender = 'non-binary')
          and ($(gender) = any (profiles.pref_gender) or $(gender) = 'non-binary')

          -- Age
          and profiles.age >= $(pref_age_min)
          and profiles.age <= $(pref_age_max)
          and $(age) >= profiles.pref_age_min
          and $(age) <= profiles.pref_age_max

          -- Location
          and calculate_earth_distance_km($(city_latitude), $(city_longitude), profiles.city_latitude,
                                          profiles.city_longitude) < $(radiusKm)
    `,
    {...profile, radiusKm: radiusKm ?? 40_000},
    convertRow
  )
}

export const getCompatibilityAnswers = async (userIds: string[]) => {
  const pg = createSupabaseDirectClient()
  return await pg.manyOrNone<Row<'compatibility_answers'>>(
    `
        select *
        from compatibility_answers
        where creator_id = any ($1)
    `,
    [userIds]
  )
}

type AnswerRow = Row<'compatibility_answers'>

export async function getAnswersForUser(userId: string) {
  const pg = createSupabaseDirectClient()
  const answersSelf = await pg.manyOrNone<AnswerRow>(
    'select * from compatibility_answers where creator_id = $1',
    [userId]
  )
  return answersSelf
}
