import {areGenderCompatible} from 'common/profiles/compatibility-util'
import {type Profile, type ProfileRow} from 'common/profiles/profile'
import {Row} from 'common/supabase/utils'
import {type User} from 'common/user'
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
  // Already folded into `user` above, and not part of the `Profile` type — sending them twice is
  // just egress.
  delete profile.name
  delete profile.username
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
    convertRow,
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
    convertRow,
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
          and not is_banned_from_posting
--           and (data ->> 'userDeleted' != 'true' or data ->> 'userDeleted' is null)
          and profiles.pinned_url is not null
    `,
    {...profile},
    convertRow,
  )
  return profiles.filter((l: Profile) => areGenderCompatible(profile, l))
}

export const getCompatibleProfiles = async (profile: ProfileRow, radiusKm: number | undefined) => {
  const pg = createSupabaseDirectClient()
  return await pg.map(
    `
        select ${PROFILE_COLS}
        from profiles
                 join
             users on users.id = profiles.user_id
        where user_id != $(user_id)
          and looking_for_matches
          and not is_banned_from_posting
--           and (data ->> 'userDeleted' != 'true' or data ->> 'userDeleted' is null)

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
    convertRow,
  )
}

// Number of other active members whose city is within `radiusKm` of this profile's city.
// Returns undefined when the profile has no city coordinates, so callers can fall back to
// non-personalised copy rather than showing a misleading zero.
export const getNearbyMemberCount = async (
  profile: Pick<ProfileRow, 'user_id' | 'city_latitude' | 'city_longitude'>,
  radiusKm: number,
): Promise<number | undefined> => {
  if (profile.city_latitude == null || profile.city_longitude == null) return undefined

  const pg = createSupabaseDirectClient()
  const row = await pg.one<{count: string}>(
    `
        select count(*) as count
        from profiles
                 join
             users on users.id = profiles.user_id
        where profiles.user_id != $(user_id)
          and profiles.looking_for_matches
          and not coalesce(users.is_banned_from_posting, false)
          and not coalesce(profiles.disabled, false)
          and profiles.city_latitude is not null
          and profiles.city_longitude is not null
          and calculate_earth_distance_km($(city_latitude), $(city_longitude), profiles.city_latitude,
                                          profiles.city_longitude) < $(radiusKm)
    `,
    {
      user_id: profile.user_id,
      city_latitude: profile.city_latitude,
      city_longitude: profile.city_longitude,
      radiusKm,
    },
  )
  return Number(row.count)
}

export const getCompatibilityAnswers = async (userIds: string[]) => {
  const pg = createSupabaseDirectClient()
  return await pg.manyOrNone<Row<'compatibility_answers'>>(
    `
        select *
        from compatibility_answers
        where creator_id = any ($1)
    `,
    [userIds],
  )
}

type AnswerRow = Row<'compatibility_answers'>

export async function getAnswersForUser(userId: string) {
  const pg = createSupabaseDirectClient()
  const answersSelf = await pg.manyOrNone<AnswerRow>(
    'select * from compatibility_answers where creator_id = $1',
    [userId],
  )
  return answersSelf
}
