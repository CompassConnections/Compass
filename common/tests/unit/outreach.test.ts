import {
  getOutreachTier,
  getProfileCompleteness,
  ProfileCompletenessInput,
} from 'common/outreach/outreach'

const emptyProfile: ProfileCompletenessInput = {
  bioLength: null,
  headline: null,
  photoCount: 0,
  occupation: null,
  educationLevel: null,
  politicalBeliefs: null,
  diet: null,
  languages: null,
  city: null,
  prefGender: null,
  interestCount: 0,
  causeCount: 0,
  compatibilityAnswerCount: 0,
  hasBig5: false,
}

const fullProfile: ProfileCompletenessInput = {
  bioLength: 800,
  headline: 'Stochastic hacker',
  photoCount: 3,
  occupation: 'physician',
  educationLevel: 'doctorate',
  politicalBeliefs: ['progressive'],
  diet: ['vegan'],
  languages: ['english', 'italian'],
  city: 'Perugia',
  prefGender: ['female'],
  interestCount: 8,
  causeCount: 5,
  compatibilityAnswerCount: 8,
  hasBig5: true,
}

describe('getProfileCompleteness', () => {
  it('scores an empty profile at zero and lists every field', () => {
    const result = getProfileCompleteness(emptyProfile)
    expect(result.score).toBe(0)
    expect(result.filled).toBe(0)
    expect(result.missing).toHaveLength(result.total)
  })

  it('scores a full profile at one with nothing missing', () => {
    const result = getProfileCompleteness(fullProfile)
    expect(result.score).toBe(1)
    expect(result.missing).toEqual([])
  })

  it('does not count a one-line bio as a bio', () => {
    const result = getProfileCompleteness({...fullProfile, bioLength: 24})
    expect(result.missing).toEqual(['bio'])
    expect(result.score).toBeLessThan(1)
  })

  it('requires more than a token interest or cause', () => {
    const result = getProfileCompleteness({...fullProfile, interestCount: 1, causeCount: 2})
    expect(result.missing).toEqual(['interests', 'causes'])
  })
})

describe('getOutreachTier', () => {
  it('puts a complete, active profile in A', () => {
    expect(
      getOutreachTier({
        completeness: 0.9,
        daysSinceLastOnline: 1,
        repliedToUs: false,
        savedSearchCount: 0,
      }),
    ).toBe('A')
  })

  it('puts an empty, never-seen profile in C', () => {
    expect(
      getOutreachTier({
        completeness: 0.1,
        daysSinceLastOnline: null,
        repliedToUs: false,
        savedSearchCount: 0,
      }),
    ).toBe('C')
  })

  it('promotes a middling profile when they have written back', () => {
    const base = {completeness: 0.5, daysSinceLastOnline: 2, savedSearchCount: 0}
    expect(getOutreachTier({...base, repliedToUs: false})).toBe('A')
    expect(getOutreachTier({...base, repliedToUs: true})).toBe('A')
  })

  it('demotes a complete profile that has gone stale', () => {
    expect(
      getOutreachTier({
        completeness: 0.9,
        daysSinceLastOnline: 120,
        repliedToUs: false,
        savedSearchCount: 0,
      }),
    ).toBe('B')
  })

  it('treats a saved search as engagement', () => {
    const stale = {completeness: 0.5, daysSinceLastOnline: 60, repliedToUs: false}
    expect(getOutreachTier({...stale, savedSearchCount: 0})).toBe('C')
    expect(getOutreachTier({...stale, savedSearchCount: 2})).toBe('B')
  })
})
