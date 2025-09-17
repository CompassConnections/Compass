import { areGenderCompatible } from 'common/love/compatibility-util'
import { type Lover, type LoverRow } from 'common/love/lover'
import { type User } from 'common/user'
import { Row } from 'common/supabase/utils'
import { createSupabaseDirectClient } from 'shared/supabase/init'

export type LoverAndUserRow = LoverRow & {
  name: string
  username: string
  user: any
}

export function convertRow(row: LoverAndUserRow): Lover
export function convertRow(row: LoverAndUserRow | undefined): Lover | null {
  if (!row) return null

  return {
    ...row,
    user: { ...row.user, name: row.name, username: row.username } as User,
  } as Lover
}

const LOVER_COLS = 'profiles.*, name, username, users.data as user'

export const getLover = async (userId: string) => {
  const pg = createSupabaseDirectClient()
  return await pg.oneOrNone(
    `
      select
        ${LOVER_COLS}
      from
        profiles
      join
        users on users.id = profiles.user_id
      where
        user_id = $1
    `,
    [userId],
    convertRow
  )
}

export const getProfiles = async (userIds: string[]) => {
  const pg = createSupabaseDirectClient()
  return await pg.map(
    `
      select
       ${LOVER_COLS}
      from
        profiles
      join
        users on users.id = profiles.user_id
      where
        user_id = any($1)
    `,
    [userIds],
    convertRow
  )
}

export const getGenderCompatibleProfiles = async (lover: LoverRow) => {
  const pg = createSupabaseDirectClient()
  const profiles = await pg.map(
    `
      select 
        ${LOVER_COLS}
      from profiles
      join
        users on users.id = profiles.user_id
      where
        user_id != $(user_id)
        and looking_for_matches
        and (data->>'isBannedFromPosting' != 'true' or data->>'isBannedFromPosting' is null)
        and (data->>'userDeleted' != 'true' or data->>'userDeleted' is null)
        and profiles.pinned_url is not null
      `,
    { ...lover },
    convertRow
  )
  return profiles.filter((l: Lover) => areGenderCompatible(lover, l))
}

export const getCompatibleProfiles = async (
  lover: LoverRow,
  radiusKm: number | undefined
) => {
  const pg = createSupabaseDirectClient()
  return await pg.map(
    `
      select 
        ${LOVER_COLS}
      from profiles
      join
        users on users.id = profiles.user_id
      where
        user_id != $(user_id)
        and looking_for_matches
        and (data->>'isBannedFromPosting' != 'true' or data->>'isBannedFromPosting' is null)
        and (data->>'userDeleted' != 'true' or data->>'userDeleted' is null)

        -- Gender
        and (profiles.gender = any($(pref_gender)) or profiles.gender = 'non-binary')
        and ($(gender) = any(profiles.pref_gender) or $(gender) = 'non-binary')

        -- Age
        and profiles.age >= $(pref_age_min)
        and profiles.age <= $(pref_age_max)
        and $(age) >= profiles.pref_age_min
        and $(age) <= profiles.pref_age_max

        -- Location
        and calculate_earth_distance_km($(city_latitude), $(city_longitude), profiles.city_latitude, profiles.city_longitude) < $(radiusKm)
      `,
    { ...lover, radiusKm: radiusKm ?? 40_000 },
    convertRow
  )
}

export const getCompatibilityAnswers = async (userIds: string[]) => {
  const pg = createSupabaseDirectClient()
  return await pg.manyOrNone<Row<'love_compatibility_answers'>>(
    `
      select * from love_compatibility_answers
      where creator_id = any($1)
    `,
    [userIds]
  )
}
