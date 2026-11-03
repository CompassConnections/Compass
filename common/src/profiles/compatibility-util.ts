import {MAX_INT, MIN_INT} from 'common/constants'
import {ProfileRow} from 'common/profiles/profile'

const isPreferredGender = (
  preferredGenders: string[] | undefined | null,
  gender: string | undefined | null,
) => {
  // console.debug('isPreferredGender', preferredGenders, gender)
  if (!preferredGenders?.length || !gender) return true

  // If simple gender preference, don't include non-binary.
  if (
    preferredGenders?.length === 1 &&
    (preferredGenders[0] === 'male' || preferredGenders[0] === 'female')
  ) {
    return preferredGenders.includes(gender)
  }
  return preferredGenders.includes(gender) || gender === 'non-binary'
}

/**
 * The profile columns the compatibility score reads — dealbreakers and factors alike. The backend
 * recompute selects exactly these (the row is ~80 columns and ~9 KB, more than half of it bio text
 * and search vectors nobody scores, and a recompute reads every eligible profile), and the scoring
 * functions are typed against this list rather than the full row, so a factor that starts reading a
 * column not listed here fails to compile instead of silently scoring `undefined`.
 */
export const SCORING_PROFILE_COLUMNS = [
  'gender',
  'pref_gender',
  'age',
  'pref_age_min',
  'pref_age_max',
  'city',
  'city_latitude',
  'city_longitude',
  'pref_max_distance',
  'pref_relation_styles',
  'pref_romantic_styles',
  'relationship_status',
  'wants_kids_strength',
  'languages',
  'religion',
  'political_beliefs',
  'diet',
  'is_smoker',
  'drinks_per_month',
  'cannabis',
  'cannabis_pref',
  'psychedelics',
  'psychedelics_pref',
  'exercise',
  'education_level',
  'big5_openness',
  'big5_conscientiousness',
  'big5_extraversion',
  'big5_agreeableness',
  'big5_neuroticism',
] as const satisfies readonly (keyof ProfileRow)[]

/** What the scorer needs of a profile. A full `ProfileRow` satisfies it. */
export type ScoringProfile = Pick<ProfileRow, (typeof SCORING_PROFILE_COLUMNS)[number]>

/** Widened to the two columns it reads, so callers holding only those need not fake a whole row. */
export type GenderFields = Pick<ProfileRow, 'gender' | 'pref_gender'>

export const areGenderCompatible = (profile1: GenderFields, profile2: GenderFields) => {
  // console.debug('areGenderCompatible', isPreferredGender(profile1.pref_gender, profile2.gender), isPreferredGender(profile2.pref_gender, profile1.gender))
  return (
    isPreferredGender(profile1.pref_gender, profile2.gender) &&
    isPreferredGender(profile2.pref_gender, profile1.gender)
  )
}

const satisfiesAgeRange = (profile: ScoringProfile, age: number | null | undefined) => {
  return (
    (age ?? MAX_INT) >= (profile.pref_age_min ?? MIN_INT) &&
    (age ?? MIN_INT) <= (profile.pref_age_max ?? MAX_INT)
  )
}

export const areAgeCompatible = (profile1: ScoringProfile, profile2: ScoringProfile) => {
  return satisfiesAgeRange(profile1, profile2.age) && satisfiesAgeRange(profile2, profile1.age)
}

export const areLocationCompatible = (profile1: ScoringProfile, profile2: ScoringProfile) => {
  if (
    !profile1.city_latitude ||
    !profile2.city_latitude ||
    !profile1.city_longitude ||
    !profile2.city_longitude
  ) {
    if (!profile1.city || !profile2.city) return true
    return profile1.city.trim().toLowerCase() === profile2.city.trim().toLowerCase()
  }

  const latitudeDiff = Math.abs(profile1.city_latitude - profile2.city_latitude)
  const longitudeDiff = Math.abs(profile1.city_longitude - profile2.city_longitude)

  const root = (latitudeDiff ** 2 + longitudeDiff ** 2) ** 0.5
  return root < 2.5
}

export const areRelationshipStyleCompatible = (
  profile1: ScoringProfile,
  profile2: ScoringProfile,
) => {
  // Blank on either side passes — and an empty array is blank, the same as null. It used to be
  // checked for null only on the second side, so someone who had cleared the field was "looking for
  // a different kind of connection" than everyone who had filled it in.
  if (!profile1.pref_relation_styles?.length || !profile2.pref_relation_styles?.length) return true
  return profile1.pref_relation_styles.some((style) =>
    profile2.pref_relation_styles?.includes(style),
  )
}

export const areWantKidsCompatible = (profile1: ScoringProfile, profile2: ScoringProfile) => {
  const {wants_kids_strength: kids1} = profile1
  const {wants_kids_strength: kids2} = profile2

  if (kids1 == null || kids2 == null) return true

  const diff = Math.abs(kids1 - kids2)
  return diff <= 2
}
