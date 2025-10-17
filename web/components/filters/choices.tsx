export const RELATIONSHIP_CHOICES = {
  // Other: 'other',
  Collaboration: 'collaboration',
  Friendship: 'friendship',
  Relationship: 'relationship',
};

export const ROMANTIC_CHOICES = {
  Monogamous: 'mono',
  Polyamorous: 'poly',
  'Open Relationship': 'open',
};

export const REVERTED_RELATIONSHIP_CHOICES = Object.fromEntries(
  Object.entries(RELATIONSHIP_CHOICES).map(([key, value]) => [value, key])
);

export const REVERTED_ROMANTIC_CHOICES = Object.fromEntries(
  Object.entries(ROMANTIC_CHOICES).map(([key, value]) => [value, key])
);