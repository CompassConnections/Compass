import {REVERTED_RELATIONSHIP_CHOICES, REVERTED_ROMANTIC_CHOICES} from "web/components/filters/choices";

export type RelationshipType = keyof typeof REVERTED_RELATIONSHIP_CHOICES
export type RomanticType = keyof typeof REVERTED_ROMANTIC_CHOICES

export function convertRelationshipType(relationshipType: RelationshipType) {
  return REVERTED_RELATIONSHIP_CHOICES[relationshipType]
}

export function convertRomanticTypes(romanticType: RomanticType) {
  return REVERTED_ROMANTIC_CHOICES[romanticType]
}
