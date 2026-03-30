import {OptionTableKey} from 'common/profiles/constants'
import {Profile, ProfileRow} from 'common/profiles/profile'
import {filterDefined} from 'common/util/array'
import {cloneDeep} from 'lodash'

export type FilterFields = {
  orderBy: 'last_online_time' | 'created_time' | 'compatibility_score'
  last_active: string | null | undefined
  geodbCityIds: string[] | null | undefined
  lat: number | null | undefined
  lon: number | null | undefined
  radius: number | null | undefined
  raised_in_lat: number | null | undefined
  raised_in_lon: number | null | undefined
  raised_in_radius: number | null | undefined
  genders: string[] | null | undefined
  cannabis: string[] | null | undefined
  psychedelics: string[] | null | undefined
  education_levels: string[] | null | undefined
  mbti: string[] | null | undefined
  name: string | null | undefined
  shortBio: boolean | null | undefined
  hasPhoto: boolean | null | undefined
  drinks_min: number | null | undefined
  drinks_max: number | null | undefined
  // Big Five personality filters (0-100 range)
  big5_openness_min: number | null | undefined
  big5_openness_max: number | null | undefined
  big5_conscientiousness_min: number | null | undefined
  big5_conscientiousness_max: number | null | undefined
  big5_extraversion_min: number | null | undefined
  big5_extraversion_max: number | null | undefined
  big5_agreeableness_min: number | null | undefined
  big5_agreeableness_max: number | null | undefined
  big5_neuroticism_min: number | null | undefined
  big5_neuroticism_max: number | null | undefined
} & {
  [K in OptionTableKey]: string[]
} & Pick<
    ProfileRow,
    | 'wants_kids_strength'
    | 'pref_relation_styles'
    | 'pref_romantic_styles'
    | 'diet'
    | 'political_beliefs'
    | 'relationship_status'
    | 'languages'
    | 'is_smoker'
    | 'psychedelics_intention'
    | 'cannabis_intention'
    | 'psychedelics_pref'
    | 'cannabis_pref'
    | 'has_kids'
    | 'pref_gender'
    | 'pref_age_min'
    | 'pref_age_max'
    | 'religion'
  >

export const orderProfiles = (profiles: Profile[], starredUserIds: string[] | undefined) => {
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
  raised_in_lat: undefined,
  raised_in_lon: undefined,
  raised_in_radius: undefined,
  name: undefined,
  genders: undefined,
  education_levels: undefined,
  pref_age_max: undefined,
  pref_age_min: undefined,
  has_kids: undefined,
  wants_kids_strength: undefined,
  is_smoker: undefined,
  psychedelics: undefined,
  cannabis: undefined,
  psychedelics_intention: undefined,
  cannabis_intention: undefined,
  psychedelics_pref: undefined,
  cannabis_pref: undefined,
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
  last_active: undefined,
  orderBy: 'created_time',
}

export const FilterKeys = Object.keys(initialFilters) as (keyof FilterFields)[]

export type OriginLocation = {id: string; name: string | null; lat: number; lon: number}
