import {Profile, ProfileRow} from "common/profiles/profile";
import {cloneDeep} from "lodash";
import {filterDefined} from "common/util/array";

// export type TargetArea = {
//   lat: number
//   lon: number
//   radius: number
// }

export type FilterFields = {
  orderBy: 'last_online_time' | 'created_time' | 'compatibility_score'
  geodbCityIds: string[] | null
  lat: number | null
  lon: number | null
  radius: number | null
  genders: string[]
  name: string | undefined
  shortBio: boolean | undefined
} & Pick<
  ProfileRow,
  | 'wants_kids_strength'
  | 'pref_relation_styles'
  | 'pref_romantic_styles'
  | 'diet'
  | 'is_smoker'
  | 'has_kids'
  | 'pref_gender'
  | 'pref_age_min'
  | 'pref_age_max'
>

export const orderProfiles = (
  profiles: Profile[],
  starredUserIds: string[] | undefined
) => {
  if (!profiles) return

  let s = cloneDeep(profiles)

  if (starredUserIds) {
    s = filterDefined([
      ...starredUserIds.map((id) => s.find((l) => l.user_id === id)),
      ...s.filter((l) => !starredUserIds.includes(l.user_id)),
    ])
  }

  // s = alternateWomenAndMen(s)

  return s
}
export const initialFilters: Partial<FilterFields> = {
  geodbCityIds: undefined,
  lat: undefined,
  lon: undefined,
  radius: undefined,
  name: undefined,
  genders: undefined,
  pref_age_max: undefined,
  pref_age_min: undefined,
  has_kids: undefined,
  wants_kids_strength: undefined,
  is_smoker: undefined,
  pref_relation_styles: undefined,
  pref_romantic_styles: undefined,
  diet: undefined,
  pref_gender: undefined,
  shortBio: undefined,
  orderBy: 'created_time',
}


export const FilterKeys = Object.keys(initialFilters) as (keyof FilterFields)[]

export type OriginLocation = { id: string; name: string, lat: number, lon: number }
