import {getCompatibilityScore} from 'common/profiles/compatibility-score'
import {Row} from 'common/supabase/utils'

type Answer = Row<'compatibility_answers'>

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

/** `n` questions both answered, every one a mutual match at the given importance. */
const matchingPair = (n: number, importance = 2) => ({
  a: Array.from({length: n}, (_, i) => answer('a', i + 1, {importance})),
  b: Array.from({length: n}, (_, i) => answer('b', i + 1, {importance})),
})

describe('getCompatibilityScore', () => {
  it('gives the whole range with nothing shared', () => {
    const result = getCompatibilityScore([], [])
    expect(result.score).toBeCloseTo(0.5)
    expect(result.sharedAnswers).toBe(0)
    expect(result.low).toBe(0)
    expect(result.high).toBe(1)
  })

  it('always brackets the point estimate', () => {
    for (const n of [1, 5, 20, 60, 150]) {
      const {a, b} = matchingPair(n)
      // Make every third answer a mismatch so the rate is not at a boundary.
      b.forEach((ans, i) => {
        if (i % 3 === 0) ans.multiple_choice = 1
      })
      const result = getCompatibilityScore(a, b)
      expect(result.low).toBeLessThanOrEqual(result.score)
      expect(result.high).toBeGreaterThanOrEqual(result.score)
      expect(result.sharedAnswers).toBe(n)
    }
  })

  it('narrows as more questions are shared', () => {
    const widths = [5, 20, 80].map((n) => {
      const {a, b} = matchingPair(n)
      const result = getCompatibilityScore(a, b)
      return result.high! - result.low!
    })
    expect(widths[0]).toBeGreaterThan(widths[1])
    expect(widths[1]).toBeGreaterThan(widths[2])
  })

  it('does not collapse to a point at 100% once the pull toward 50% is gone', () => {
    const {a, b} = matchingPair(120)
    const result = getCompatibilityScore(a, b)
    expect(result.score).toBeCloseTo(1)
    expect(result.high).toBe(1)
    expect(result.low).toBeLessThan(1)
    expect(result.low).toBeGreaterThan(0.9)
  })

  it('leaves the point estimate where it was', () => {
    // 4 shared answers, importance 2 (5 points each), 3 matches one way and 4 the other.
    const {a, b} = matchingPair(4)
    b[0].multiple_choice = 1
    const result = getCompatibilityScore(a, b)
    const w = 25 - 2.5 * Math.sqrt(4)
    const side1 = (15 + w / 2) / (20 + w)
    const side2 = (20 + w / 2) / (20 + w)
    expect(result.score).toBeCloseTo(Math.sqrt(side1 * side2), 10)
  })

  it('skipped answers are not shared', () => {
    const {a, b} = matchingPair(3)
    b[2].importance = -1
    expect(getCompatibilityScore(a, b).sharedAnswers).toBe(2)
  })
})
