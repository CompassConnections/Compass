export const RELATIONSHIP_CHOICES = {
  // Monogamous: 'mono',
  // Polyamorous: 'poly',
  // 'Open Relationship': 'open',
  // Other: 'other',
  Collaboration: 'collaboration',
  Friendship: 'friendship',
  Relationship: 'relationship',
};

export const REVERTED_RELATIONSHIP_CHOICES = Object.fromEntries(
  Object.entries(RELATIONSHIP_CHOICES).map(([key, value]) => [value, key])
);