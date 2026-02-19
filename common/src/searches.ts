// Define nice labels for each key
import {FilterFields, initialFilters} from 'common/filters'
import {wantsKidsNames} from 'common/wants-kids'
import {hasKidsNames} from 'common/has-kids'
import {milesToKm} from "common/measurement-utils";

const filterLabels: Record<string, string> = {
  geodbCityIds: '',
  location: '',
  name: 'Searching',
  genders: '',
  education_levels: 'Education',
  pref_age_max: 'Max age',
  pref_age_min: 'Min age',
  drinks_max: 'Max drinks',
  drinks_min: 'Min drinks',
  relationship_status: '',
  has_kids: '',
  wants_kids_strength: 'Kids',
  is_smoker: '',
  pref_relation_styles: 'Seeking',
  interests: '',
  causes: '',
  work: '',
  religion: '',
  pref_gender: '',
  orderBy: '',
  diet: 'Diet',
  political_beliefs: 'Political views',
  languages: '',
  mbti: 'MBTI',
}

export type locationType = {
  location: {
    name: string
  }
  radius: number
}

const skippedKeys = [
  'pref_age_min',
  'pref_age_max',
  'geodbCityIds',
  'orderBy',
  'shortBio',
  'targetArea',
  'lat',
  'lon',
  'radius',
]

export function formatFilters(
  filters: Partial<FilterFields>,
  location: locationType | null,
  choicesIdsToLabels: Record<string, any>,
  measurementSystem?: 'metric' | 'imperial'
): String[] | null {
  const entries: String[] = []

  let ageEntry = null
  let ageMin: number | undefined | null = filters.pref_age_min
  if (ageMin == 18) ageMin = undefined
  let ageMax = filters.pref_age_max
  if (ageMax == 100) ageMax = undefined
  if (ageMin || ageMax) {
    let text: string = 'Age: '
    if (ageMin) text = `${text}${ageMin}`
    if (ageMax) {
      if (ageMin) {
        text = `${text}-${ageMax}`
      } else {
        text = `${text}up to ${ageMax}`
      }
    } else {
      text = `${text}+`
    }
    ageEntry = text
  }

  Object.entries(filters).forEach(([key, value]) => {
    const typedKey = key as keyof FilterFields

    if (value === undefined || value === null) return
    if (skippedKeys.includes(typedKey)) return
    if (Array.isArray(value) && value.length === 0) return
    if (initialFilters[typedKey] === value) return

    const label = filterLabels[typedKey] ?? key

    let stringValue = value
    if (key === 'has_kids') stringValue = hasKidsNames[value as number]
    if (key === 'wants_kids_strength')
      stringValue = wantsKidsNames[value as number]
    if (Array.isArray(value)) {
      if (choicesIdsToLabels[key]) {
        value = value.map((id) => choicesIdsToLabels[key][id])
      }
      stringValue = value.join(', ')
    }

    if (!label) {
      const str = String(stringValue)
      stringValue = str.charAt(0).toUpperCase() + str.slice(1)
    }

    const display = stringValue

    entries.push(`${label}${label ? ': ' : ''}${display}`)
  })

  if (ageEntry) entries.push(ageEntry)

  if (location?.location?.name) {
    const radius = location?.radius || 0
    let formattedRadius: string
    if (measurementSystem === 'metric') {
      formattedRadius = `${Math.round(milesToKm(radius))} km`
    } else {
      formattedRadius = `${Math.round(radius)}mi`
    }
    const locString = `${location?.location?.name} (${formattedRadius})`
    entries.push(locString)
  }

  if (entries.length === 0) return ['Anyone']

  return entries
}
