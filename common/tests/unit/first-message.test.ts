import {
  distinctiveWords,
  DUPLICATE_OPENER_SIMILARITY,
  findDuplicateOpener,
  MIN_ANSWERS_TO_MESSAGE,
  MIN_BIO_CHARS_TO_MESSAGE,
  normalizeWord,
  openerSimilarity,
  profileGateIssues,
  profileReferences,
  profileVocabulary,
  referencesProfile,
  requiredReferences,
} from 'common/moderation/first-message'

const bio =
  'I spend most weekends climbing in the Ardennes and most evenings reading moral philosophy. ' +
  'I left a career in consulting to work on animal welfare, and I am looking for someone who ' +
  'takes ideas seriously but can also laugh at them. Vegetarian, slowly turning vegan.'

const profile = {
  name: 'Julie Dupont',
  username: 'julied',
  headline: 'Philosophy nerd who climbs',
  keywords: ['climbing', 'moral philosophy', 'animal welfare'],
  bioText: bio,
}

describe('normalizeWord', () => {
  it('lowercases, strips diacritics, possessives and punctuation', () => {
    expect(normalizeWord('Éthique,')).toBe('ethique')
    expect(normalizeWord("Julie's")).toBe('julie')
    expect(normalizeWord('Julie’s')).toBe('julie')
    expect(normalizeWord('(climbing)')).toBe('climbing')
  })
})

describe('distinctiveWords', () => {
  it('keeps only words of five letters or more that are not stopwords', () => {
    expect(distinctiveWords('I really love climbing and good food')).toEqual(['climbing'])
  })

  it('drops the excluded words and returns each word once', () => {
    expect(distinctiveWords('Julie climbs, Julie reads, climbs', ['Julie'])).toEqual([
      'climbs',
      'reads',
    ])
  })
})

describe('profileVocabulary', () => {
  it('draws on headline, keywords and bio but never on the member’s own name', () => {
    const vocabulary = profileVocabulary(profile)
    expect(vocabulary).toEqual(expect.arrayContaining(['climbing', 'philosophy', 'welfare']))
    expect(vocabulary).not.toContain('julie')
    expect(vocabulary).not.toContain('dupont')
    expect(vocabulary).not.toContain('julied')
  })

  it('is empty for an empty profile', () => {
    expect(profileVocabulary({})).toEqual([])
  })
})

describe('profileReferences', () => {
  const vocabulary = profileVocabulary(profile)

  it('finds the profile words a message picks up, with simple inflections', () => {
    const message = 'You climb in the Ardennes? I started climbing last year. And the welfare work'
    expect(profileReferences(message, vocabulary)).toEqual(
      expect.arrayContaining(['climbing', 'welfare']),
    )
  })

  it('does not count the recipient’s name or a generic compliment', () => {
    const message =
      'Hi Julie! You seem really interesting and your photos are beautiful, lovely smile'
    expect(profileReferences(message, vocabulary)).toEqual([])
  })
})

describe('requiredReferences', () => {
  it('asks for nothing from a near-empty profile and one word from any other', () => {
    expect(requiredReferences([])).toBe(0)
    expect(requiredReferences(['climbing', 'ardennes'])).toBe(0)
    expect(requiredReferences(Array.from({length: 10}, (_, i) => `word${i}`))).toBe(1)
    // Advisory check: one shared keyword is enough to stay quiet, however long the bio.
    expect(requiredReferences(Array.from({length: 40}, (_, i) => `word${i}`))).toBe(1)
  })
})

describe('referencesProfile', () => {
  const vocabulary = profileVocabulary(profile)

  it('accepts a message that picks up two things from the profile', () => {
    expect(
      referencesProfile(
        'Moral philosophy and climbing in one profile — which philosophers do you keep coming back to?',
        vocabulary,
      ),
    ).toBe(true)
  })

  it('rejects a generic opener', () => {
    expect(
      referencesProfile(
        'Hey Julie, I really liked your profile and I think we would get along. How is your week going?',
        vocabulary,
      ),
    ).toBe(false)
  })

  it('lets anything through when the recipient wrote almost nothing', () => {
    expect(
      referencesProfile('Hello there, how are you?', profileVocabulary({headline: 'hi'})),
    ).toBe(true)
  })
})

describe('openerSimilarity', () => {
  const template = (name: string, topic: string) =>
    `Hi ${name}, I came across your profile and really liked what you wrote about ${topic}. ` +
    'I am also into deep conversations and would love to get to know you better. ' +
    'What are you looking for on here, and what does a good week look like for you?'

  it('scores a name-swapped template as near-identical', () => {
    const similarity = openerSimilarity(template('Julie', 'climbing'), template('Anna', 'pottery'))
    expect(similarity).toBeGreaterThan(DUPLICATE_OPENER_SIMILARITY)
  })

  it('scores two different messages as different', () => {
    const other =
      'Your line about leaving consulting for animal welfare stopped me: I did the opposite move ' +
      'three years ago and still think about it. Was there one moment that decided it for you?'
    expect(openerSimilarity(template('Julie', 'climbing'), other)).toBeLessThan(0.3)
  })

  it('is 0 when either side is empty', () => {
    expect(openerSimilarity('', 'anything')).toBe(0)
  })
})

describe('findDuplicateOpener', () => {
  it('returns the closest earlier opener over the threshold', () => {
    const message = 'one two three four five six seven eight nine ten'
    const previous = [
      'completely different words here nothing shared at all',
      'one two three four five six seven eight nine eleven',
      'one two three four five six seven twelve thirteen fourteen',
    ]
    expect(findDuplicateOpener(message, previous)).toEqual({
      index: 1,
      similarity: expect.closeTo(9 / 11, 5),
    })
  })

  it('returns null when nothing is close', () => {
    expect(findDuplicateOpener('alpha beta gamma delta', ['one two three four'])).toBeNull()
  })
})

describe('profileGateIssues', () => {
  it('passes a profile with a bio and enough answers', () => {
    expect(
      profileGateIssues({bioChars: MIN_BIO_CHARS_TO_MESSAGE, answers: MIN_ANSWERS_TO_MESSAGE}),
    ).toBeNull()
  })

  it('names what is missing', () => {
    expect(profileGateIssues({bioChars: 0, answers: MIN_ANSWERS_TO_MESSAGE})).toEqual({
      bio: true,
      answers: false,
    })
    expect(profileGateIssues({bioChars: MIN_BIO_CHARS_TO_MESSAGE, answers: 0})).toEqual({
      bio: false,
      answers: true,
    })
  })
})
