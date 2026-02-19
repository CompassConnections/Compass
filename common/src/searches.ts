// Define nice labels for each key
import {
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_GENDERS,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_MBTI_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_RELATIONSHIP_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  INVERTED_ROMANTIC_CHOICES,
} from 'common/choices'
import {FilterFields, initialFilters} from 'common/filters'
import {hasKidsNames} from 'common/has-kids'
import {milesToKm} from 'common/measurement-utils'
import {wantsKidsNames} from 'common/wants-kids'
import {capitalize} from 'lodash'

const filterLabels: Record<string, string> = {
  geodbCityIds: '',
  location: '',
  name: 'Searching',
  genders: '',
  pref_gender: 'Gender they seek',
  education_levels: 'Education',
  pref_age_max: 'Max age',
  pref_age_min: 'Min age',
  relationship_status: '',
  has_kids: '',
  wants_kids_strength: '',
  is_smoker: '',
  pref_relation_styles: 'Seeking',
  pref_romantic_styles: '',
  interests: '',
  causes: '',
  work: '',
  religion: '',
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
  // Big Five min/max keys are handled separately
  'big5_openness_min',
  'big5_openness_max',
  'big5_conscientiousness_min',
  'big5_conscientiousness_max',
  'big5_extraversion_min',
  'big5_extraversion_max',
  'big5_agreeableness_min',
  'big5_agreeableness_max',
  'big5_neuroticism_min',
  'big5_neuroticism_max',
  // Drinks min/max keys are handled separately
  'drinks_min',
  'drinks_max',
]

export function formatFilters(
  filters: Partial<FilterFields>,
  location: locationType | null,
  choicesIdsToLabels: Record<string, any>,
  measurementSystem?: 'metric' | 'imperial',
  t?: (key: string, fallback: string) => string,
): string[] | null {
  const entries: string[] = []

  // Helper function to translate UI text
  const translate = (key: string, fallback: string): string => {
    return t ? t(key, fallback) : fallback
  }

  let ageEntry = null
  let ageMin: number | undefined | null = filters.pref_age_min
  if (ageMin == 18) ageMin = undefined
  let ageMax = filters.pref_age_max
  if (ageMax == 100) ageMax = undefined
  if (ageMin || ageMax) {
    let text: string = translate('filter.age.label', 'Age') + ': '
    if (ageMin) text = `${text}${ageMin}`
    if (ageMax) {
      if (ageMin) {
        text = `${text}-${ageMax}`
      } else {
        text = `${text}${translate('filter.age.up_to', 'up to')} ${ageMax}`
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

    // Translate the label if it exists and we have a translation function
    let translatedLabel = label
    if (label && t) {
      const labelKey = `filter.label.${typedKey}`
      translatedLabel = t(labelKey, label)
    }

    // console.log(key, value)
    let stringValue = value
    if (key === 'has_kids')
      stringValue = translate(`profile.has_kids.${value}`, hasKidsNames[value as number])
    else if (key === 'wants_kids_strength')
      stringValue = translate(`profile.wants_kids_${value}`, wantsKidsNames[value as number])
    else if (key === 'is_smoker')
      stringValue = translate(
        `profile.smoker.${value ? 'yes' : 'no'}`,
        value ? 'Smoker' : 'Non-smoker',
      )
    if (Array.isArray(value)) {
      if (choicesIdsToLabels[key]) {
        value = value.map((id) => choicesIdsToLabels[key][id])
      } else if (key === 'mbti') {
        value = value.map((s) => INVERTED_MBTI_CHOICES[s])
      } else if (key === 'pref_romantic_styles') {
        value = value.map((s) => translate(`profile.romantic.${s}`, INVERTED_ROMANTIC_CHOICES[s]))
      } else if (key === 'pref_relation_styles') {
        value = value.map((s) =>
          translate(`profile.relationship.${s}`, INVERTED_RELATIONSHIP_CHOICES[s]),
        )
      } else if (key === 'relationship_status') {
        value = value.map((s) =>
          translate(`profile.relationship_status.${s}`, INVERTED_RELATIONSHIP_STATUS_CHOICES[s]),
        )
      } else if (key === 'political_beliefs') {
        value = value.map((s) => translate(`profile.political.${s}`, INVERTED_POLITICAL_CHOICES[s]))
      } else if (key === 'diet') {
        value = value.map((s) => translate(`profile.diet.${s}`, INVERTED_DIET_CHOICES[s]))
      } else if (key === 'education_levels') {
        value = value.map((s) => translate(`profile.education.${s}`, INVERTED_EDUCATION_CHOICES[s]))
      } else if (key === 'religion') {
        value = value.map((s) => translate(`profile.religion.${s}`, INVERTED_RELIGION_CHOICES[s]))
      } else if (key === 'languages') {
        value = value.map((s) => translate(`profile.language.${s}`, INVERTED_LANGUAGE_CHOICES[s]))
      } else if (key === 'pref_gender') {
        value = value.map((s) => translate(`profile.gender.${s}`, INVERTED_GENDERS[s]))
      } else if (key === 'genders') {
        value = value.map((s) => translate(`profile.gender.${s}`, INVERTED_GENDERS[s]))
      }
      stringValue = value.join(', ')
    }

    if (!label) {
      const str = String(stringValue)
      stringValue = str.charAt(0).toUpperCase() + str.slice(1)
    }

    const display = stringValue

    entries.push(`${translatedLabel}${translatedLabel ? ': ' : ''}${display}`)
  })

  if (ageEntry) entries.push(ageEntry)

  // Process Big Five personality traits as ranges
  const big5Traits = [
    {name: 'openness', min: 'big5_openness_min', max: 'big5_openness_max'},
    {
      name: 'conscientiousness',
      min: 'big5_conscientiousness_min',
      max: 'big5_conscientiousness_max',
    },
    {
      name: 'extraversion',
      min: 'big5_extraversion_min',
      max: 'big5_extraversion_max',
    },
    {
      name: 'agreeableness',
      min: 'big5_agreeableness_min',
      max: 'big5_agreeableness_max',
    },
    {
      name: 'neuroticism',
      min: 'big5_neuroticism_min',
      max: 'big5_neuroticism_max',
    },
  ] as const

  big5Traits.forEach(({name, min, max}) => {
    const minValue = filters[min as keyof FilterFields] as number | undefined
    const maxValue = filters[max as keyof FilterFields] as number | undefined

    if (minValue !== undefined || maxValue !== undefined) {
      const traitName = translate(`profile.big5_${name}`, capitalize(name))
      let rangeText: string

      if (minValue !== undefined && maxValue !== undefined) {
        // Both min and max: "12-78"
        rangeText = `${minValue}-${maxValue}`
      } else if (minValue !== undefined) {
        // Only min: "12+"
        rangeText = `${minValue}+`
      } else {
        // Only max: "up to 82"
        rangeText = `${translate('filter.age.up_to', 'up to')} ${maxValue}`
      }

      entries.push(`${traitName}: ${rangeText}`)
    }
  })

  // Process drinks as range
  const drinksMin = filters.drinks_min
  const drinksMax = filters.drinks_max
  if (drinksMin !== undefined || drinksMax !== undefined) {
    const drinksLabel = translate('filter.label.drinks', 'Drinks')
    const perMonth = translate('filter.drinks.per_month', 'per month')
    let drinksText: string

    if (drinksMin !== undefined && drinksMax !== undefined) {
      // Both min and max: "12-78"
      drinksText = `${drinksMin}-${drinksMax}`
    } else if (drinksMin !== undefined) {
      // Only min: "12+"
      drinksText = `${drinksMin}+`
    } else {
      // Only max: "up to 82"
      drinksText = `${translate('filter.age.up_to', 'up to')} ${drinksMax}`
    }

    entries.push(`${drinksLabel}: ${drinksText} ${perMonth}`)
  }

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

  if (entries.length === 0) return [translate('filter.any_new_users', 'Any new user')]

  return entries
}
