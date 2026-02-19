import {
  INVERTED_DIET_CHOICES,
  INVERTED_EDUCATION_CHOICES,
  INVERTED_LANGUAGE_CHOICES,
  INVERTED_POLITICAL_CHOICES,
  INVERTED_RACE_CHOICES,
  INVERTED_RELATIONSHIP_CHOICES,
  INVERTED_RELATIONSHIP_STATUS_CHOICES,
  INVERTED_RELIGION_CHOICES,
  INVERTED_ROMANTIC_CHOICES
} from "common/choices";

export type RelationshipType = keyof typeof INVERTED_RELATIONSHIP_CHOICES

export function convertRelationshipType(relationshipType: RelationshipType) {
  return INVERTED_RELATIONSHIP_CHOICES[relationshipType]
}

export type RelationshipStatusType = keyof typeof INVERTED_RELATIONSHIP_STATUS_CHOICES

export function convertRelationshipStatusTypes(relationshipStatusType: RelationshipStatusType) {
  return INVERTED_RELATIONSHIP_STATUS_CHOICES[relationshipStatusType]
}

export type RomanticType = keyof typeof INVERTED_ROMANTIC_CHOICES

export function convertRomanticTypes(romanticType: RomanticType) {
  return INVERTED_ROMANTIC_CHOICES[romanticType]
}

export type DietType = keyof typeof INVERTED_DIET_CHOICES

export function convertDietTypes(dietType: DietType) {
  return INVERTED_DIET_CHOICES[dietType]
}

export type PoliticalType = keyof typeof INVERTED_POLITICAL_CHOICES

export function convertPoliticalTypes(politicalType: PoliticalType) {
  return INVERTED_POLITICAL_CHOICES[politicalType]
}

export type EducationType = keyof typeof INVERTED_EDUCATION_CHOICES

export function convertEducationTypes(educationType: EducationType) {
  return INVERTED_EDUCATION_CHOICES[educationType]
}

export type ReligionType = keyof typeof INVERTED_RELIGION_CHOICES

export function convertReligionTypes(religionType: ReligionType) {
  return INVERTED_RELIGION_CHOICES[religionType]
}

export type LanguageType = keyof typeof INVERTED_LANGUAGE_CHOICES

export function convertLanguageTypes(languageType: LanguageType) {
  return INVERTED_LANGUAGE_CHOICES[languageType]
}

export type RaceType = keyof typeof INVERTED_RACE_CHOICES

export function convertRace(race: RaceType) {
  return INVERTED_RACE_CHOICES[race]
}