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

export const POLITICAL_CHOICES = {
  Progressive: 'progressive',
  Liberal: 'liberal',
  'Moderate / Centrist': 'moderate',
  Conservative: 'conservative',
  Socialist: 'socialist',
  Nationalist: 'nationalist',
  Populist: 'populist',
  'Green / Eco-Socialist': 'green',
  Technocratic: 'technocratic',
  Libertarian: 'libertarian',
  'Effective Accelerationism': 'e/acc',
  'Pause AI / Tech Skeptic': 'pause ai',
  'Independent / Other': 'other',
}

export const REVERTED_RELATIONSHIP_CHOICES = Object.fromEntries(
  Object.entries(RELATIONSHIP_CHOICES).map(([key, value]) => [value, key])
);

export const REVERTED_ROMANTIC_CHOICES = Object.fromEntries(
  Object.entries(ROMANTIC_CHOICES).map(([key, value]) => [value, key])
);

export const REVERTED_POLITICAL_CHOICES = Object.fromEntries(
  Object.entries(POLITICAL_CHOICES).map(([key, value]) => [value, key])
);