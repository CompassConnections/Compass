import {ProfileRow} from 'common/profiles/profile'
import {Row as rowFor} from 'common/supabase/utils'
import {clamp, keyBy, sumBy} from 'lodash'

import {
  areAgeCompatible,
  areLocationCompatible,
  areRelationshipStyleCompatible,
  areWantKidsCompatible,
} from './compatibility-util'

const importanceToScore = {
  0: 0,
  1: 1,
  2: 5,
  3: 25,
} as {[importance: string]: number}

export type CompatibilityScore = {
  score: number
  /**
   * Edges of the likely range of `score` (roughly a 95% credible interval, see
   * {@link getSideEstimate}). Absent on rows precomputed before the range existed, until the next
   * recompute fills them in.
   */
  low?: number
  high?: number
  /** Questions both people answered without skipping — what the range is based on. */
  sharedAnswers?: number
  confidence: 'low' | 'medium' | 'high'
}

/** Two-sided 95% under a normal approximation. */
const Z_95 = 1.96
/**
 * Floor on the prior, in effective observations. Past 100 shared answers the pull toward 50% is
 * gone, and with no prior at all a pair who match on every question would get a band of zero width
 * at 100% — the normal approximation collapses on the boundary. One pseudo-observation keeps the
 * edge honest without moving the point estimate by more than a fraction of a point.
 */
const MIN_PRIOR_STRENGTH = 1

/**
 * One direction's estimate: the same shrunk point estimate as before, plus the edges of its likely
 * range.
 *
 * The point estimate `(score + W/2) / (max + W)` is the mean of a Beta prior pulling toward 50%,
 * so the range is that posterior's. The one correction is that importance weights inflate the
 * evidence — one "very important" match is worth 25 points, not 25 questions — so the posterior is
 * built on the effective number of questions, `(Σw)² / Σw²`, with the prior rescaled to the same
 * units so its mean still lands exactly on the point estimate. Questions are correlated and served
 * in a fixed order, so the nominal 95% is optimistic: present it as a likely range, not a
 * confidence level.
 */
const getSideEstimate = (
  score: number,
  maxScore: number,
  sumSquaredWeights: number,
  weightTowardFiftyPercent: number,
) => {
  const denominator = maxScore + weightTowardFiftyPercent
  // Only when the pull toward 50% has gone (>=100 shared answers) and every one of them was marked
  // "not important": no evidence either way.
  const mean = denominator > 0 ? (score + weightTowardFiftyPercent / 2) / denominator : 0.5

  const effectiveN = maxScore > 0 ? (maxScore * maxScore) / sumSquaredWeights : 0
  const matchRate = maxScore > 0 ? score / maxScore : 0.5
  const priorStrength = Math.max(
    maxScore > 0 ? (weightTowardFiftyPercent * effectiveN) / maxScore : 0,
    MIN_PRIOR_STRENGTH,
  )
  const alpha = priorStrength / 2 + matchRate * effectiveN
  const beta = priorStrength / 2 + (1 - matchRate) * effectiveN
  const total = alpha + beta
  const center = alpha / total
  const sd = Math.sqrt((alpha * beta) / (total * total * (total + 1)))

  return {
    mean,
    low: clamp(center - Z_95 * sd, 0, 1),
    high: clamp(center + Z_95 * sd, 0, 1),
  }
}

export const getCompatibilityScore = (
  answers1: rowFor<'compatibility_answers'>[],
  answers2: rowFor<'compatibility_answers'>[],
): CompatibilityScore => {
  const {
    score: score1,
    maxScore: maxScore1,
    sumSquaredWeights: sumSquaredWeights1,
    answerCount,
  } = getAnswersCompatibility(answers1, answers2)
  const {
    score: score2,
    maxScore: maxScore2,
    sumSquaredWeights: sumSquaredWeights2,
  } = getAnswersCompatibility(answers2, answers1)

  // >=100 answers in common leads to no weight toward 50%.
  // Use sqrt for diminishing returns to answering more questions.
  const weightTowardFiftyPercent = Math.max(25 - 2.5 * Math.sqrt(answerCount), 0)
  // const upWeight = weightTowardFiftyPercent / 2
  // const downWeight = weightTowardFiftyPercent
  // const compat1 = (score1 + upWeight) / (maxScore1 + downWeight)
  // const compat2 = (score2 + upWeight) / (maxScore2 + downWeight)
  const side1 = getSideEstimate(score1, maxScore1, sumSquaredWeights1, weightTowardFiftyPercent)
  const side2 = getSideEstimate(score2, maxScore2, sumSquaredWeights2, weightTowardFiftyPercent)
  const geometricMean = Math.sqrt(side1.mean * side2.mean)
  // The same mean applied edge to edge. It is not the exact interval of the product, but both sides
  // rest on the same shared answers, so their ranges move together and this is close enough for a
  // band on a bar.
  const low = Math.min(Math.sqrt(side1.low * side2.low), geometricMean)
  const high = Math.max(Math.sqrt(side1.high * side2.high), geometricMean)

  const confidence = answerCount < 10 ? 'low' : answerCount < 100 ? 'medium' : 'high'

  return {score: geometricMean, low, high, sharedAnswers: answerCount, confidence}
}

const getAnswersCompatibility = (
  answers1: rowFor<'compatibility_answers'>[],
  answers2: rowFor<'compatibility_answers'>[],
) => {
  const answers2ByQuestionId = keyBy(answers2, 'question_id')
  let maxScore = 0
  // Σw² alongside Σw (`maxScore`), for the effective question count behind the range.
  let sumSquaredWeights = 0
  let answerCount = 0

  const score = sumBy(answers1, (a) => {
    if (a.importance === -1) return 0

    const answer2 = answers2ByQuestionId[a.question_id]
    // Not answered or skipped.
    if (!answer2 || answer2.importance === -1) return 0

    answerCount++
    const importanceScore = importanceToScore[a.importance] ?? 0
    maxScore += importanceScore
    sumSquaredWeights += importanceScore * importanceScore
    return getAnswerCompatibilityImportanceScore(a, answer2)
  })

  return {score, maxScore, sumSquaredWeights, answerCount}
}

export function getAnswerCompatibilityImportanceScore(
  answer1: rowFor<'compatibility_answers'>,
  answer2: rowFor<'compatibility_answers'>,
) {
  const importanceScore = importanceToScore[answer1.importance] ?? 0
  return answer1.pref_choices.includes(answer2.multiple_choice) ? importanceScore : 0
}

export function getAnswerCompatibility(
  answer1: rowFor<'compatibility_answers'>,
  answer2: rowFor<'compatibility_answers'>,
) {
  if (answer1.importance < 0 || answer2.importance < 0) {
    return false
  }

  const compatibility1to2 = answer1.pref_choices.includes(answer2.multiple_choice)
  const compatibility2to1 = answer2.pref_choices.includes(answer1.multiple_choice)

  return compatibility1to2 && compatibility2to1
}

export function getScoredAnswerCompatibility(
  answer1: rowFor<'compatibility_answers'>,
  answer2: rowFor<'compatibility_answers'>,
) {
  if (answer1.importance < 0 || answer2.importance < 0) {
    return 0
  }

  const compatibility1to2 = +answer1.pref_choices.includes(answer2.multiple_choice)
  const compatibility2to1 = +answer2.pref_choices.includes(answer1.multiple_choice)
  const importanceCompatibility = 1 - Math.abs(answer1.importance - answer2.importance) / 4

  // Adjust these weights to change the impact of each component
  const compatibilityWeight = 0.7
  const importanceWeight = 0.3

  return (
    ((compatibility1to2 + compatibility2to1) * compatibilityWeight +
      importanceCompatibility * importanceWeight) /
    2
  )
}

export const getProfilesCompatibilityFactor = (profile1: ProfileRow, profile2: ProfileRow) => {
  let multiplier = 1
  multiplier *= areAgeCompatible(profile1, profile2) ? 1 : 0.5
  multiplier *= areRelationshipStyleCompatible(profile1, profile2) ? 1 : 0.5
  multiplier *= areWantKidsCompatible(profile1, profile2) ? 1 : 0.5
  multiplier *= areLocationCompatible(profile1, profile2) ? 1 : 0.1
  return multiplier
}

export const hasAnsweredQuestions = (questions: rowFor<'compatibility_answers'>[]) => {
  if (!questions?.length) return false
  for (const question of questions) {
    if (question.importance >= 0) return true
  }
  return false
}
