import {
  FACTOR_KEYS,
  flatEarthMiles,
  getDealbreakers,
  getOverallCompatibility,
  getSharedOptions,
  ProfileForScoring,
  SCORE_FLOOR,
  ScoredCompatibility,
} from 'common/profiles/compatibility-factors'
import {Row} from 'common/supabase/utils'

type Answer = Row<'compatibility_answers'>

/** A blank profile: every factor on the blank path, no dealbreaker can fire. */
const profile = (overrides: Partial<ProfileForScoring> = {}): ProfileForScoring =>
  ({
    id: 1,
    user_id: 'u',
    gender: null,
    pref_gender: null,
    age: null,
    pref_age_min: null,
    pref_age_max: null,
    pref_relation_styles: null,
    pref_romantic_styles: null,
    wants_kids_strength: null,
    city: null,
    city_latitude: null,
    city_longitude: null,
    pref_max_distance: null,
    relationship_status: null,
    languages: null,
    religion: null,
    political_beliefs: null,
    cannabis: null,
    cannabis_pref: null,
    psychedelics: null,
    psychedelics_pref: null,
    big5_openness: null,
    big5_conscientiousness: null,
    big5_extraversion: null,
    big5_agreeableness: null,
    big5_neuroticism: null,
    is_smoker: null,
    drinks_per_month: null,
    diet: null,
    exercise: null,
    education_level: null,
    ...overrides,
  }) as unknown as ProfileForScoring

const answer = (
  creatorId: string,
  questionId: number,
  overrides: Partial<Answer> = {},
): Answer => ({
  id: questionId,
  created_time: '',
  creator_id: creatorId,
  question_id: questionId,
  multiple_choice: 0,
  pref_choices: [0],
  importance: 2,
  explanation: null,
  ...overrides,
})

const matchingAnswers = (n: number) => ({
  answersA: Array.from({length: n}, (_, i) => answer('a', i + 1)),
  answersB: Array.from({length: n}, (_, i) => answer('b', i + 1)),
})

const scored = (
  a: ProfileForScoring,
  b: ProfileForScoring,
  prompt?: Parameters<typeof getOverallCompatibility>[2],
) => {
  const result = getOverallCompatibility(a, b, prompt)
  if (result.kind !== 'scored') throw new Error(`dealbreaker: ${result.dealbreakers.join(',')}`)
  return result as ScoredCompatibility
}

const factor = (
  a: ProfileForScoring,
  b: ProfileForScoring,
  key: keyof ScoredCompatibility['factors'],
) => scored(a, b).factors[key]

const relationship = {pref_relation_styles: ['relationship']}

describe('getDealbreakers', () => {
  it('is empty for two blank profiles', () => {
    expect(getDealbreakers(profile(), profile())).toEqual([])
  })

  it('fires on gender in either direction', () => {
    const woman = profile({gender: 'female', pref_gender: ['male']})
    const man = profile({gender: 'male', pref_gender: ['male']})
    expect(getDealbreakers(woman, man)).toEqual(['gender'])
  })

  it('fires when the connection types do not overlap, and passes a blank side', () => {
    const friends = profile({pref_relation_styles: ['friendship']})
    const lovers = profile(relationship)
    expect(getDealbreakers(friends, lovers)).toEqual(['connection_type'])
    expect(getDealbreakers(friends, profile())).toEqual([])
    // An empty array is blank too, whichever side it is on.
    expect(getDealbreakers(friends, profile({pref_relation_styles: []}))).toEqual([])
    expect(getDealbreakers(profile({pref_relation_styles: []}), friends)).toEqual([])
  })

  it('fires on a monogamy conflict only when both seek a relationship', () => {
    const mono = profile({...relationship, pref_romantic_styles: ['mono']})
    const poly = profile({...relationship, pref_romantic_styles: ['poly', 'open']})
    expect(getDealbreakers(mono, poly)).toEqual(['monogamy'])
    expect(
      getDealbreakers(
        mono,
        profile({
          pref_relation_styles: ['friendship', 'relationship'],
          pref_romantic_styles: ['mono', 'open'],
        }),
      ),
    ).toEqual([])
    const polyFriend = profile({
      pref_relation_styles: ['friendship'],
      pref_romantic_styles: ['poly'],
    })
    expect(getDealbreakers(mono, polyFriend)).toEqual(['connection_type'])
  })

  it('fires on kids more than two steps apart, and treats -1 as unanswered', () => {
    const no = profile({...relationship, wants_kids_strength: 0})
    const yes = profile({...relationship, wants_kids_strength: 4})
    const neutral = profile({...relationship, wants_kids_strength: 2})
    const noPref = profile({...relationship, wants_kids_strength: -1})
    expect(getDealbreakers(no, yes)).toEqual(['wants_kids'])
    expect(getDealbreakers(no, neutral)).toEqual([])
    expect(getDealbreakers(yes, noPref)).toEqual([])
  })
})

describe('factors', () => {
  it('scores every factor on the blank path for two blank profiles', () => {
    const result = scored(profile(), profile())
    for (const key of FACTOR_KEYS) {
      const f = result.factors[key]
      expect(f.blank).toBe(true)
      expect(f.high).toBe(1)
      expect(f.low).toBeLessThanOrEqual(f.score)
    }
    expect(result.factors.prompts.weight).toBe(1)
    expect(result.factors.prompts.score).toBe(0.5)
    expect(result.prompt).toBeUndefined()
    expect(result.factors.age.weight).toBe(1.5)
  })

  it('clamps an answered factor range to [floor, 1] around the score', () => {
    const f = factor(profile({languages: ['en']}), profile({languages: ['en']}), 'languages')
    expect(f).toMatchObject({score: 1, high: 1, blank: false, weight: 2})
    expect(f.low).toBeCloseTo(0.9)
    const g = factor(profile({languages: ['en']}), profile({languages: ['fr']}), 'languages')
    expect(g.score).toBe(0.1)
    expect(g.low).toBe(SCORE_FLOOR)
  })

  describe('prompts', () => {
    it('grows in weight with shared answers and keeps the posterior range', () => {
      const few = scored(profile(), profile(), matchingAnswers(4))
      const many = scored(profile(), profile(), matchingAnswers(100))
      expect(few.factors.prompts.weight).toBeCloseTo(8 * 0.2)
      expect(many.factors.prompts.weight).toBeCloseTo(8)
      expect(few.prompt?.low).toBeLessThan(few.prompt!.score)
      expect(many.prompt?.score).toBeGreaterThan(few.prompt!.score)
      expect(many.sharedAnswers).toBe(100)
      expect(many.confidence).toBe('high')
    })

    it('accepts an already computed prompt score, as the browser passes it', () => {
      const result = scored(profile(), profile(), {
        score: 0.8,
        low: 0.6,
        high: 0.9,
        sharedAnswers: 25,
      })
      expect(result.factors.prompts).toMatchObject({
        score: 0.8,
        low: 0.6,
        high: 0.9,
        weight: 4,
        blank: false,
      })
      expect(result.prompt).toEqual({score: 0.8, low: 0.6, high: 0.9})
    })
  })

  describe('age', () => {
    const me = profile({age: 30, pref_age_min: 25, pref_age_max: 35})
    it('is 1 inside both ranges and discounts by years outside', () => {
      expect(factor(me, profile({age: 33}), 'age').score).toBe(1)
      expect(factor(me, profile({age: 37}), 'age').score).toBe(0.5)
      expect(factor(me, profile({age: 40}), 'age').score).toBe(0.2)
      expect(factor(me, profile({age: 50}), 'age').score).toBe(SCORE_FLOOR)
    })
    it('takes the worse direction', () => {
      const other = profile({age: 33, pref_age_min: 40, pref_age_max: 50})
      expect(factor(me, other, 'age').score).toBe(SCORE_FLOOR)
    })
    it('is blank without ages or without any range', () => {
      expect(factor(me, profile(), 'age').blank).toBe(true)
      expect(factor(profile({age: 30}), profile({age: 31}), 'age').blank).toBe(true)
    })
  })

  describe('wants_kids', () => {
    it('grades the difference inside the band, only when both seek a relationship', () => {
      const k = (n: number) => profile({...relationship, wants_kids_strength: n})
      expect(factor(k(4), k(4), 'wants_kids').score).toBe(1)
      expect(factor(k(4), k(3), 'wants_kids').score).toBe(0.85)
      expect(factor(k(4), k(2), 'wants_kids').score).toBe(0.6)
      expect(
        factor(profile({wants_kids_strength: 4}), profile({wants_kids_strength: 0}), 'wants_kids')
          .blank,
      ).toBe(true)
    })
  })

  describe('distance', () => {
    const paris = {city: 'Paris', city_latitude: 48.86, city_longitude: 2.35}
    const lyon = {city: 'Lyon', city_latitude: 45.76, city_longitude: 4.84}
    it('measures miles on a flat earth', () => {
      expect(flatEarthMiles(48.86, 2.35, 45.76, 4.84)).toBeCloseTo(243, -1)
    })
    it('slides gently to 0.6 when nobody set a cap', () => {
      expect(factor(profile(paris), profile(paris), 'distance').score).toBe(1)
      const d = factor(profile(paris), profile(lyon), 'distance').score
      expect(d).toBeGreaterThan(0.75)
      expect(d).toBeLessThan(0.85)
      const far = profile({city_latitude: -33.87, city_longitude: 151.21})
      expect(factor(profile(paris), far, 'distance').score).toBeCloseTo(0.6)
    })
    it('decays progressively past a stated cap', () => {
      const capped = profile({...paris, pref_max_distance: 100})
      const at = (miles: number) =>
        factor(
          capped,
          profile({city_latitude: 48.86 + miles / 69, city_longitude: 2.35}),
          'distance',
        ).score
      expect(at(90)).toBeGreaterThan(0.85)
      expect(at(150)).toBeCloseTo(0.56, 1)
      expect(at(200)).toBeCloseTo(0.27, 1)
      expect(at(300)).toBe(SCORE_FLOOR)
    })
    it('compares city names without coordinates', () => {
      expect(factor(profile({city: 'Paris '}), profile({city: 'paris'}), 'distance').score).toBe(1)
      expect(factor(profile({city: 'Paris'}), profile({city: 'Lyon'}), 'distance').score).toBe(0.8)
    })
    it('discounts an unlocated partner by the located side’s cap', () => {
      expect(factor(profile(paris), profile(), 'distance').score).toBe(0.7)
      expect(
        factor(profile({...paris, pref_max_distance: 100}), profile(), 'distance').score,
      ).toBeCloseTo(0.2)
      expect(
        factor(profile({...paris, pref_max_distance: 2000}), profile(), 'distance').score,
      ).toBeCloseTo(0.7)
      expect(
        factor(profile({...paris, pref_max_distance: 500}), profile(), 'distance').score,
      ).toBeCloseTo(0.47, 1)
      expect(factor(profile(paris), profile(), 'distance').blank).toBe(false)
      expect(factor(profile(), profile(), 'distance').blank).toBe(true)
    })
  })

  describe('availability', () => {
    it('penalises single with taken unless someone is non-exclusive', () => {
      const single = profile({...relationship, relationship_status: ['single']})
      const married = profile({...relationship, relationship_status: ['married']})
      const openMarried = profile({
        ...relationship,
        relationship_status: ['married'],
        pref_romantic_styles: ['open'],
      })
      expect(factor(single, married, 'availability').score).toBe(0.1)
      expect(factor(single, openMarried, 'availability').score).toBe(1)
      expect(factor(single, single, 'availability').score).toBe(1)
    })
  })

  it('scores overlap factors: religion, politics, monogamy', () => {
    expect(
      factor(
        profile({religion: ['buddhist']}),
        profile({religion: ['buddhist', 'other']}),
        'religion',
      ).score,
    ).toBe(1)
    expect(
      factor(profile({religion: ['buddhist']}), profile({religion: ['christian']}), 'religion')
        .score,
    ).toBe(0.4)
    expect(
      factor(
        profile({political_beliefs: ['green']}),
        profile({political_beliefs: ['liberal']}),
        'politics',
      ).score,
    ).toBe(0.4)
    const mono = profile({...relationship, pref_romantic_styles: ['mono']})
    expect(factor(mono, mono, 'monogamy').score).toBe(1)
    expect(
      factor(mono, profile({...relationship, pref_romantic_styles: ['mono', 'open']}), 'monogamy')
        .score,
    ).toBe(0.8)
  })

  describe('substances', () => {
    it('reads a preference against the other’s use, best preference wins, worst direction counts', () => {
      const abstainer = profile({cannabis_pref: ['not'], cannabis: 'never_not_interested'})
      const regular = profile({cannabis: 'regularly', cannabis_pref: ['use']})
      // not × regularly = 0.1 one way, use × never = 0.3 the other way.
      expect(factor(abstainer, regular, 'cannabis').score).toBe(0.1)
      expect(
        factor(
          profile({cannabis_pref: ['not', 'open']}),
          profile({cannabis: 'regularly'}),
          'cannabis',
        ).score,
      ).toBe(1)
      expect(
        factor(profile({cannabis_pref: ['use']}), profile({cannabis: 'rarely'}), 'cannabis').score,
      ).toBe(0.7)
      expect(
        factor(profile({cannabis: 'rarely'}), profile({cannabis: 'rarely'}), 'cannabis').blank,
      ).toBe(true)
      expect(
        factor(
          profile({psychedelics_pref: ['not']}),
          profile({psychedelics: 'occasionally'}),
          'psychedelics',
        ).score,
      ).toBe(0.3)
    })
  })

  it('scores Big Five by mean absolute difference', () => {
    const traits = (v: number) => ({
      big5_openness: v,
      big5_conscientiousness: v,
      big5_extraversion: v,
      big5_agreeableness: v,
      big5_neuroticism: v,
    })
    expect(factor(profile(traits(50)), profile(traits(70)), 'big5').score).toBeCloseTo(0.8)
    expect(
      factor(profile(traits(50)), profile({...traits(50), big5_neuroticism: null}), 'big5').blank,
    ).toBe(true)
  })

  describe('shared_options', () => {
    it('matches across the three taxonomies by normalised name', () => {
      const a = profile({
        interests_names: ['Effective altruism', 'Hiking'],
        causes_names: [],
        work_names: ['AI safety'],
      })
      const b = profile({
        interests_names: ['hiking '],
        causes_names: ['effective altruism'],
        work_names: [],
      })
      // Bags: a = {ea, hiking, ai safety}, b = {hiking, ea} → J = 2/3.
      expect(factor(a, b, 'shared_options').score).toBe(1)
      expect(getSharedOptions(a, b)).toEqual([
        {name: 'Effective altruism', tablesA: ['interests'], tablesB: ['causes']},
        {name: 'Hiking', tablesA: ['interests'], tablesB: ['interests']},
      ])
    })
    it('is 0.5 with nothing shared and blank with nothing held', () => {
      expect(
        factor(profile({interests_names: ['a']}), profile({causes_names: ['b']}), 'shared_options')
          .score,
      ).toBe(0.5)
      expect(factor(profile({interests_names: ['a']}), profile(), 'shared_options').blank).toBe(
        true,
      )
    })
  })

  it('scores smoking, drinking, exercise and education', () => {
    expect(factor(profile({is_smoker: true}), profile({is_smoker: false}), 'smoking').score).toBe(
      0.5,
    )
    expect(
      factor(profile({drinks_per_month: 0}), profile({drinks_per_month: 10}), 'drinking').score,
    ).toBeCloseTo(0.7)
    expect(
      factor(profile({drinks_per_month: 0}), profile({drinks_per_month: 40}), 'drinking').score,
    ).toBeCloseTo(0.4)
    expect(
      factor(profile({exercise: 'rarely'}), profile({exercise: 'often'}), 'exercise').score,
    ).toBe(0.5)
    expect(
      factor(
        profile({education_level: 'bachelors'}),
        profile({education_level: 'masters'}),
        'education',
      ).score,
    ).toBe(1)
    expect(
      factor(
        profile({education_level: 'high-school'}),
        profile({education_level: 'doctorate'}),
        'education',
      ).score,
    ).toBe(0.6)
  })

  describe('diet', () => {
    it('weighs heavily when a plant-based eater is involved', () => {
      const vegan = profile({diet: ['vegan']})
      const veg = profile({diet: ['veg']})
      const omni = profile({diet: ['omnivore']})
      const pesc = profile({diet: ['pescetarian']})
      expect(factor(vegan, vegan, 'diet')).toMatchObject({score: 1, weight: 2})
      expect(factor(vegan, veg, 'diet')).toMatchObject({score: 0.9, weight: 2})
      expect(factor(veg, pesc, 'diet')).toMatchObject({score: 0.6, weight: 2})
      expect(factor(vegan, omni, 'diet')).toMatchObject({score: 0.3, weight: 2})
    })
    it('barely counts between two non-plant-based eaters', () => {
      const omni = profile({diet: ['omnivore']})
      const keto = profile({diet: ['keto', 'other']})
      expect(factor(omni, omni, 'diet')).toMatchObject({score: 0.8, weight: 0.5})
      expect(factor(omni, keto, 'diet')).toMatchObject({score: 0.7, weight: 0.5})
      expect(factor(omni, profile({diet: ['other']}), 'diet').blank).toBe(true)
    })
    it('reduces a multi-select to its strictest entry', () => {
      expect(
        factor(profile({diet: ['omnivore', 'vegan']}), profile({diet: ['vegan']}), 'diet').score,
      ).toBe(1)
    })
  })
})

describe('getOverallCompatibility', () => {
  it('returns the dealbreakers and nothing else when one fires', () => {
    const result = getOverallCompatibility(
      profile({pref_relation_styles: ['friendship']}),
      profile(relationship),
      undefined,
    )
    expect(result).toEqual({kind: 'dealbreaker', dealbreakers: ['connection_type']})
  })

  it('brackets the score and gives a wide range for blank profiles', () => {
    const result = scored(profile(), profile())
    expect(result.low).toBeLessThanOrEqual(result.score)
    expect(result.high).toBeGreaterThanOrEqual(result.score)
    expect(result.high - result.low).toBeGreaterThan(0.4)
  })

  it('narrows as fields are filled in, and a near-zero important factor sinks the total', () => {
    const full = profile({
      ...relationship,
      age: 30,
      pref_age_min: 25,
      pref_age_max: 35,
      wants_kids_strength: 4,
      city: 'Paris',
      city_latitude: 48.86,
      city_longitude: 2.35,
      relationship_status: ['single'],
      languages: ['en'],
      religion: ['atheist'],
      political_beliefs: ['green'],
      pref_romantic_styles: ['mono'],
      cannabis: 'never_not_interested',
      cannabis_pref: ['not'],
      psychedelics: 'never_curious',
      psychedelics_pref: ['open'],
      big5_openness: 70,
      big5_conscientiousness: 60,
      big5_extraversion: 40,
      big5_agreeableness: 80,
      big5_neuroticism: 30,
      is_smoker: false,
      drinks_per_month: 2,
      diet: ['veg'],
      exercise: 'sometimes',
      education_level: 'masters',
      interests_names: ['Hiking', 'Chess'],
      causes_names: ['Climate'],
      work_names: [],
    })
    const blank = scored(profile(), profile())
    const twin = scored(full, full, matchingAnswers(60))
    expect(twin.score).toBeGreaterThan(0.95)
    expect(twin.high - twin.low).toBeLessThan(blank.high - blank.low)
    expect(Object.values(twin.factors).every((f) => !f.blank)).toBe(true)

    const farAway = scored(full, {...full, languages: ['zh']}, matchingAnswers(60))
    expect(farAway.score).toBeLessThan(twin.score - 0.1)
  })

  it('reaches the same overall from answers and from the stored prompt score', () => {
    const a = profile({languages: ['en'], religion: ['atheist']})
    const b = profile({languages: ['en'], religion: ['christian']})
    const fromAnswers = scored(a, b, matchingAnswers(20))
    const fromStored = scored(a, b, {...fromAnswers.prompt!, sharedAnswers: 20})
    expect(fromStored.score).toBeCloseTo(fromAnswers.score, 10)
    expect(fromStored.low).toBeCloseTo(fromAnswers.low, 10)
    expect(fromStored.high).toBeCloseTo(fromAnswers.high, 10)
  })
})
