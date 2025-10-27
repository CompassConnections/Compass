import { ProfileRow } from 'common/profiles/profile'
import {MAX_INT, MIN_INT} from "common/constants";

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

export const areGenderCompatible = (profile1: ProfileRow, profile2: ProfileRow) => {
  // console.debug('areGenderCompatible', isPreferredGender(profile1.pref_gender, profile2.gender), isPreferredGender(profile2.pref_gender, profile1.gender))
  return (
    isPreferredGender(profile1.pref_gender, profile2.gender) &&
    isPreferredGender(profile2.pref_gender, profile1.gender)
  )
}

const satisfiesAgeRange = (profile: ProfileRow, age: number | null | undefined) => {
  return (age ?? MAX_INT) >= (profile.pref_age_min ?? MIN_INT) && (age ?? MIN_INT) <= (profile.pref_age_max ?? MAX_INT)
}

export const areAgeCompatible = (profile1: ProfileRow, profile2: ProfileRow) => {
  return (
    satisfiesAgeRange(profile1, profile2.age) &&
    satisfiesAgeRange(profile2, profile1.age)
  )
}

export const areLocationCompatible = (profile1: ProfileRow, profile2: ProfileRow) => {
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
  profile1: ProfileRow,
  profile2: ProfileRow
) => {
  if (!profile1.pref_relation_styles?.length || !profile2.pref_relation_styles) return true
  return profile1.pref_relation_styles.some((style) =>
    profile2.pref_relation_styles?.includes(style)
  )
}

export const areWantKidsCompatible = (profile1: ProfileRow, profile2: ProfileRow) => {
  const { wants_kids_strength: kids1 } = profile1
  const { wants_kids_strength: kids2 } = profile2

  if (kids1 == null || kids2 == null) return true

  const diff = Math.abs(kids1 - kids2)
  return diff <= 2
}
