// Define nice labels for each key
import {FilterFields, initialFilters} from "common/filters";
import {wantsKidsNames} from "common/wants-kids";
import {hasKidsNames} from "common/has-kids";

const filterLabels: Record<string, string> = {
  geodbCityIds: "",
  location: "",
  name: "Searching",
  genders: "",
  pref_age_max: "Max age",
  pref_age_min: "Min age",
  has_kids: "",
  wants_kids_strength: "Kids",
  is_smoker: "",
  pref_relation_styles: "Seeking",
  pref_gender: "",
  orderBy: "",
}

export type locationType = {
  location: {
    name: string
  }
  radius: number
}


export function formatFilters(filters: Partial<FilterFields>, location: locationType | null): String[] | null {
  const entries: String[] = []

  let ageEntry = null
  let ageMin: number | undefined | null = filters.pref_age_min
  if (ageMin == 18) ageMin = undefined
  let ageMax = filters.pref_age_max;
  if (ageMax == 99 || ageMax == 100) ageMax = undefined
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
    if (typedKey == 'pref_age_min' || typedKey == 'pref_age_max' || typedKey == 'geodbCityIds' || typedKey == 'orderBy') return
    if (Array.isArray(value) && value.length === 0) return
    if (initialFilters[typedKey] === value) return

    const label = filterLabels[typedKey] ?? key

    let stringValue = value
    if (key === 'has_kids') stringValue = hasKidsNames[value as number]
    if (key === 'wants_kids_strength') stringValue = wantsKidsNames[value as number]
    if (Array.isArray(value)) stringValue = value.join(', ')

    if (!label) {
      const str = String(stringValue)
      stringValue = str.charAt(0).toUpperCase() + str.slice(1)
    }

    const display = stringValue

    entries.push(`${label}${label ? ': ' : ''}${display}`)
  })

  if (ageEntry) entries.push(ageEntry)

  if (location?.location?.name) {
    const locString = `${location?.location?.name} (${location?.radius}mi)`
    entries.push(locString)
  }

  if (entries.length === 0) return ['Anyone']

  return entries
}