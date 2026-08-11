import {
  getEffectiveStage,
  getLookingForSearchFilters,
  getOutreachTier,
  getProfileCompleteness,
  outcomeRate,
  OutreachOutcomes,
  ProfileCompletenessInput,
  sumOutcomes,
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

  it('counts a pinned image as their photo', () => {
    const noPhotos = {...fullProfile, photoCount: 0}
    expect(getProfileCompleteness(noPhotos).missing).toEqual(['photo'])
    expect(
      getProfileCompleteness({...noPhotos, pinnedUrl: 'https://…/pinned.jpg'}).missing,
    ).toEqual([])
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

describe('getLookingForSearchFilters', () => {
  it('maps stated preferences onto the filter keys the search actually reads', () => {
    expect(
      getLookingForSearchFilters({
        prefAgeMin: 28,
        prefAgeMax: 40,
        prefGender: ['female'],
        prefRelationStyles: ['friendship'],
      }),
    ).toEqual({
      // Their preferred gender becomes the candidate's own gender, not the candidate's preference.
      genders: ['female'],
      pref_relation_styles: ['friendship'],
      pref_age_min: 28,
      pref_age_max: 40,
    })
  })

  it('keeps a partial preference rather than dropping the whole search', () => {
    expect(
      getLookingForSearchFilters({
        prefAgeMin: null,
        prefAgeMax: null,
        prefGender: [],
        prefRelationStyles: ['relationship'],
      }),
    ).toEqual({pref_relation_styles: ['relationship']})
  })

  it('returns null when they said nothing, so no one gets an alert for everybody', () => {
    expect(
      getLookingForSearchFilters({
        prefAgeMin: null,
        prefAgeMax: null,
        prefGender: null,
        prefRelationStyles: null,
      }),
    ).toBeNull()
  })
})

describe('outcomeRate', () => {
  it('is a rounded percentage of the bucket', () => {
    expect(outcomeRate(1, 3)).toBe(33)
    expect(outcomeRate(3, 3)).toBe(100)
  })

  // An empty stage is normal — nothing has reached it yet — and must not render NaN%.
  it('is zero for an empty bucket rather than a division by zero', () => {
    expect(outcomeRate(0, 0)).toBe(0)
  })
})

describe('sumOutcomes', () => {
  const a: OutreachOutcomes = {
    members: 10,
    repliedToUs: 4,
    messagedMember: 3,
    heardFromMember: 2,
    broughtSomeone: 1,
  }
  const b: OutreachOutcomes = {
    members: 5,
    repliedToUs: 1,
    messagedMember: 1,
    heardFromMember: 0,
    broughtSomeone: 0,
  }

  it('adds every column, so the total line reconciles with the rows above it', () => {
    expect(sumOutcomes([a, b])).toEqual({
      members: 15,
      repliedToUs: 5,
      messagedMember: 4,
      heardFromMember: 2,
      broughtSomeone: 1,
    })
  })

  it('sums to zero when there is nothing to sum', () => {
    expect(sumOutcomes([])).toEqual({
      members: 0,
      repliedToUs: 0,
      messagedMember: 0,
      heardFromMember: 0,
      broughtSomeone: 0,
    })
  })
})

describe('getEffectiveStage', () => {
  it('shows a thread I opened as opened, not as not started', () => {
    expect(getEffectiveStage(null, true)).toBe('opened')
  })

  it('leaves someone I have never written to at not started', () => {
    expect(getEffectiveStage(null, false)).toBe('not_started')
  })

  // The column exists to record what a query cannot infer, so an inference must never overrule it —
  // including the deliberate act of setting a contacted member back to 'not_started'.
  it('never overrules a stage that was set by hand', () => {
    expect(getEffectiveStage('closed', true)).toBe('closed')
    expect(getEffectiveStage('not_started', true)).toBe('not_started')
    expect(getEffectiveStage('excluded', false)).toBe('excluded')
  })
})
