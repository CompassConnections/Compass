import {Profile, ProfileRow} from "common/profiles/profile";
import {cloneDeep} from "lodash";
import {filterDefined} from "common/util/array";
import {OptionTableKey} from "common/profiles/constants";

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
  education_levels: string[]
  mbti: string[]
  name: string | undefined
  shortBio: boolean | undefined
  drinks_min: number | undefined
  drinks_max: number | undefined
  // Big Five personality filters (0-100 range)
  big5_openness_min: number | undefined
  big5_openness_max: number | undefined
  big5_conscientiousness_min: number | undefined
  big5_conscientiousness_max: number | undefined
  big5_extraversion_min: number | undefined
  big5_extraversion_max: number | undefined
  big5_agreeableness_min: number | undefined
  big5_agreeableness_max: number | undefined
  big5_neuroticism_min: number | undefined
  big5_neuroticism_max: number | undefined
} & {
  [K in OptionTableKey]: string[]
}
  & Pick<
  ProfileRow,
  | 'wants_kids_strength'
  | 'pref_relation_styles'
  | 'pref_romantic_styles'
  | 'diet'
  | 'political_beliefs'
  | 'relationship_status'
  | 'languages'
  | 'is_smoker'
  | 'has_kids'
  | 'pref_gender'
  | 'pref_age_min'
  | 'pref_age_max'
  | 'religion'
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
  education_levels: undefined,
  pref_age_max: undefined,
  pref_age_min: undefined,
  has_kids: undefined,
  wants_kids_strength: undefined,
  is_smoker: undefined,
  pref_relation_styles: undefined,
  pref_romantic_styles: undefined,
  diet: undefined,
  political_beliefs: undefined,
  interests: undefined,
  causes: undefined,
  work: undefined,
  relationship_status: undefined,
  languages: undefined,
  religion: undefined,
  mbti: undefined,
  pref_gender: undefined,
  shortBio: undefined,
  drinks_min: undefined,
  drinks_max: undefined,
  big5_openness_min: undefined,
  big5_openness_max: undefined,
  big5_conscientiousness_min: undefined,
  big5_conscientiousness_max: undefined,
  big5_extraversion_min: undefined,
  big5_extraversion_max: undefined,
  big5_agreeableness_min: undefined,
  big5_agreeableness_max: undefined,
  big5_neuroticism_min: undefined,
  big5_neuroticism_max: undefined,
  orderBy: 'created_time',
}


export const FilterKeys = Object.keys(initialFilters) as (keyof FilterFields)[]

export type OriginLocation = { id: string; name: string | null, lat: number, lon: number }
