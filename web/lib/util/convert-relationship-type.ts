import {REVERTED_RELATIONSHIP_CHOICES} from "web/components/filters/choices";

export type RelationshipType = keyof typeof REVERTED_RELATIONSHIP_CHOICES

export function convertRelationshipType(relationshipType: RelationshipType) {
  return REVERTED_RELATIONSHIP_CHOICES[relationshipType]
}
