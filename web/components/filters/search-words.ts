export const WORDS: string[] = [
  // Values
  'Minimalism',
  'Sustainability',
  'Veganism',
  'Meditation',
  'Climate',
  'Animal',
  'Community living',
  'Open source',
  'Spirituality',

  // Intellectual interests
  'Philosophy',
  'AI safety',
  'Psychology',

  // Arts & culture
  'Indie film',
  'Jazz',
  'Contemporary art',
  'Folk music',
  'Poetry',
  'Sci-fi',
  'Board games',

  // Relationship intentions
  'Study buddy',
  'Co-founder',

  // Lifestyle
  'Digital nomad',
  'Permaculture',
  'Yoga',

  // Random human quirks (to make it feel alive)
  'Chess',
  'Rock climbing',
  'Stargazing',

  // Other
  'Feminism',
  'Coding',
  'ENFP',
  'INTP',
  'Therapy',
  'Science',
  'Camus',
  'Running',
  'Writing',
  'Reading',
  'Anime',
  'Drawing',
  'Photography',
  'Linux',
  'History',
  'Graphics design',
  'Math',
  'Ethereum',
  'Finance',
]

export function getRandomPair(words = WORDS, count = 3): string {
  const shuffled = [...words].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count).join(', ')
}
