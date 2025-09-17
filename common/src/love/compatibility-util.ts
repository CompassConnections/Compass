import { ProfileRow } from 'common/love/profile'
import {MAX_INT, MIN_INT} from "common/constants";

const isPreferredGender = (
  preferredGenders: string[] | undefined,
  gender: string | undefined
) => {
  // console.log('isPreferredGender', preferredGenders, gender)
  if (preferredGenders === undefined || preferredGenders.length === 0 || gender === undefined) return true

  // If simple gender preference, don't include non-binary.
  if (
    preferredGenders.length === 1 &&
    (preferredGenders[0] === 'male' || preferredGenders[0] === 'female')
  ) {
    return preferredGenders.includes(gender)
  }
  return preferredGenders.includes(gender) || gender === 'non-binary'
}

export const areGenderCompatible = (profile1: ProfileRow, profile2: ProfileRow) => {
  // console.log('areGenderCompatible', isPreferredGender(profile1.pref_gender, profile2.gender), isPreferredGender(profile2.pref_gender, profile1.gender))
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
  )
    return profile1.city.trim().toLowerCase() === profile2.city.trim().toLowerCase()

  const latitudeDiff = Math.abs(profile1.city_latitude - profile2.city_latitude)
  const longigudeDiff = Math.abs(profile1.city_longitude - profile2.city_longitude)

  const root = (latitudeDiff ** 2 + longigudeDiff ** 2) ** 0.5
  return root < 2.5
}

export const areRelationshipStyleCompatible = (
  profile1: ProfileRow,
  profile2: ProfileRow
) => {
  return profile1.pref_relation_styles.some((style) =>
    profile2.pref_relation_styles.includes(style)
  )
}

export const areWantKidsCompatible = (profile1: ProfileRow, profile2: ProfileRow) => {
  const { wants_kids_strength: kids1 } = profile1
  const { wants_kids_strength: kids2 } = profile2

  if (kids1 === undefined || kids2 === undefined) return true

  const diff = Math.abs(kids1 - kids2)
  return diff <= 2
}
