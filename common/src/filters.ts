import {Profile, ProfileRow} from "common/love/lover";
import {cloneDeep} from "lodash";
import {filterDefined} from "common/util/array";

export type FilterFields = {
  orderBy: 'last_online_time' | 'created_time' | 'compatibility_score'
  geodbCityIds: string[] | null
  genders: string[]
  name: string | undefined
} & Pick<
  ProfileRow,
  | 'wants_kids_strength'
  | 'pref_relation_styles'
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
  name: undefined,
  genders: undefined,
  pref_age_max: undefined,
  pref_age_min: undefined,
  has_kids: undefined,
  wants_kids_strength: undefined,
  is_smoker: undefined,
  pref_relation_styles: undefined,
  pref_gender: undefined,
  orderBy: 'created_time',
}
export type OriginLocation = { id: string; name: string }
