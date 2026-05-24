import {GENDERS, GENDERS_PLURAL, INVERTED_GENDERS} from 'common/choices'

export type Gender = string

export function convertGender(gender: string): string {
  // Legacy values
  if (gender === 'male') return 'man'
  if (gender === 'female') return 'woman'
  if (gender === 'trans-woman') return 'trans woman'
  if (gender === 'trans-man') return 'trans man'
  if (gender === 'other') return 'other'
  // Look up in INVERTED_GENDERS (value → label)
  return INVERTED_GENDERS[gender] ?? gender
}

export function convertGenderPlural(gender: string): string {
  // Legacy values
  if (gender === 'male') return 'men'
  if (gender === 'female') return 'women'
  if (gender === 'trans-woman') return 'trans women'
  if (gender === 'trans-man') return 'trans men'
  if (gender === 'other') return 'other'
  // Look up plural label from GENDERS_PLURAL by value
  const entry = Object.entries(GENDERS_PLURAL).find(([, v]) => v === gender)
  return entry ? entry[0].toLowerCase() : gender
}

export const DEFAULT_GENDERS = [GENDERS.Woman, GENDERS.Man]
export const EXTRA_GENDERS = Object.values(GENDERS).filter(
  (v) => !DEFAULT_GENDERS.includes(v as any),
)
