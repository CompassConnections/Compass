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
  // Scalar on the profile, multi-select as a filter — same shape as `cannabis` above.
  exercise: string[] | null | undefined
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
    | 'orientation'
    | 'neurotype'
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
  exercise: undefined,
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
  orientation: undefined,
  neurotype: undefined,
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

/**
 * Filters that are set on every search and narrow nobody: sort order, and the flag that *widens* the
 * results to incomplete profiles.
 */
const NON_NARROWING_FILTER_KEYS: string[] = ['orderBy', 'shortBio']

/**
 * The language filter is pre-set to the signup locale rather than chosen, so for the English majority
 * it is furniture, not a decision — and English is the language most of the directory speaks anyway,
 * so it narrows almost nobody. Picking a *different* language is a real choice and still counts.
 */
const DEFAULT_LANGUAGE_FILTER = 'english'

/**
 * Whether a search actually asks for someone in particular.
 *
 * A saved search with nothing set matches every new member, so it fires on every signup forever —
 * which is not an alert, it is a subscription to the whole directory. Worse, it makes the signal
 * useless: "their saved search matched" stops meaning anything once it matches everyone.
 *
 * Shared by the save button, the endpoint behind it, and the alert job, so all three agree on what
 * counts as a search rather than each deciding separately.
 */
export const hasSearchCriteria = (
  filters: Partial<FilterFields> | null | undefined,
  location?: unknown,
): boolean => {
  // A location filter is a constraint in its own right, and is stored outside search_filters.
  if (location) return true
  if (!filters || typeof filters !== 'object') return false

  return Object.entries(filters).some(([key, value]) => {
    if (NON_NARROWING_FILTER_KEYS.includes(key)) return false
    if (value === undefined || value === null || value === '') return false
    if (key === 'languages' && Array.isArray(value)) {
      return value.some((language) => language !== DEFAULT_LANGUAGE_FILTER)
    }
    if (Array.isArray(value)) return value.length > 0
    return true
  })
}

export type OriginLocation = {id: string; name: string | null; lat: number; lon: number}
