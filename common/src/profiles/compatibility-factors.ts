import {ProfileOptions} from 'common/profiles/profile'
import {WANTS_KIDS_TOLERANCE} from 'common/wants-kids'
import {clamp, intersection, max, mean, sumBy, union, uniq} from 'lodash'

import {AnswerForScoring, CompatibilityScore, getCompatibilityScore} from './compatibility-score'
import {
  areGenderCompatible,
  areRelationshipStyleCompatible,
  ScoringProfile,
} from './compatibility-util'

/**
 * The overall compatibility score: a dealbreaker gate, then a weighted geometric mean of per-field
 * factors, of which the prompt score (`getCompatibilityScore`) is one. Every rule here is spelled
 * out, with its weights, in `docs/compatibility-score.md`; this file is that document in code, and
 * the member-facing `/compatibility-score` page is derived from the same document. Change one,
 * change the other two.
 *
 * Pure on purpose. The backend runs it over every pair when a member edits answers or profile and
 * stores only the overall and prompt numbers; the browser runs the very same function when the
 * breakdown modal opens, from the two profiles already on the page plus the stored prompt score, so
 * the two agree whenever nothing has changed since the last recompute.
 */

/**
 * The scored columns of a profile (`SCORING_PROFILE_COLUMNS`) with the option labels the cross-table
 * factor compares. A full `Profile` satisfies it, which is what the browser passes.
 */
export type ProfileForScoring = ScoringProfile &
  Pick<ProfileOptions, 'interests_names' | 'causes_names' | 'work_names'>

// ---------------------------------------------------------------------------------------------------
// Dealbreakers
// ---------------------------------------------------------------------------------------------------

export const DEALBREAKER_KEYS = ['gender', 'connection_type', 'monogamy', 'wants_kids'] as const
export type DealbreakerKey = (typeof DEALBREAKER_KEYS)[number]

const seeksRelationship = (p: ScoringProfile) => !!p.pref_relation_styles?.includes('relationship')
const bothSeekRelationship = (a: ScoringProfile, b: ScoringProfile) =>
  seeksRelationship(a) && seeksRelationship(b)

/** `null` and the form's `-1` ("no preference") are both "not answered". */
const wantsKidsAnswered = (p: ScoringProfile) =>
  p.wants_kids_strength != null && p.wants_kids_strength >= 0

const overlaps = (a: string[] | null | undefined, b: string[] | null | undefined) =>
  intersection(a ?? [], b ?? []).length > 0

/**
 * The structural mismatches that make everything else moot. Symmetric; a blank passes (except the
 * gender preference, which `areGenderCompatible` reads as it always has). Empty means "scorable".
 */
export const getDealbreakers = (a: ScoringProfile, b: ScoringProfile): DealbreakerKey[] => {
  const out: DealbreakerKey[] = []
  if (!areGenderCompatible(a, b)) out.push('gender')
  if (!areRelationshipStyleCompatible(a, b)) out.push('connection_type')
  if (
    bothSeekRelationship(a, b) &&
    a.pref_romantic_styles?.length &&
    b.pref_romantic_styles?.length &&
    !overlaps(a.pref_romantic_styles, b.pref_romantic_styles)
  ) {
    out.push('monogamy')
  }
  if (
    bothSeekRelationship(a, b) &&
    wantsKidsAnswered(a) &&
    wantsKidsAnswered(b) &&
    Math.abs(a.wants_kids_strength! - b.wants_kids_strength!) > WANTS_KIDS_TOLERANCE
  ) {
    out.push('wants_kids')
  }
  return out
}

// ---------------------------------------------------------------------------------------------------
// Factors
// ---------------------------------------------------------------------------------------------------

export const FACTOR_KEYS = [
  'prompts',
  'age',
  'wants_kids',
  'distance',
  'availability',
  'languages',
  'religion',
  'politics',
  'monogamy',
  'cannabis',
  'psychedelics',
  'big5',
  'shared_options',
  'smoking',
  'drinking',
  'diet',
  'exercise',
  'education',
] as const
export type FactorKey = (typeof FACTOR_KEYS)[number]

export type FactorResult = {
  score: number
  low: number
  high: number
  /** The weight actually used: the registry's, halved when `blank`. */
  weight: number
  /** One side (or both) left the field empty: scored at the prior with the wide range. */
  blank: boolean
}

type FactorContext = {prompt: CompatibilityScore}

type FactorDef = {
  key: FactorKey
  weight: number | ((a: ProfileForScoring, b: ProfileForScoring, ctx: FactorContext) => number)
  /** Half-width of the likely range when both sides answered. */
  u: number
  /** Point estimate when the rule cannot be evaluated. */
  prior: number
  /** Lower edge of the range when the rule cannot be evaluated (its worst attainable score). */
  floor: number
  /** `undefined` means the rule cannot be evaluated for this pair. */
  score: (a: ProfileForScoring, b: ProfileForScoring, ctx: FactorContext) => number | undefined
  /** Overrides the `± u` range when both sides answered (the prompts' Beta posterior). */
  range?: (
    a: ProfileForScoring,
    b: ProfileForScoring,
    ctx: FactorContext,
  ) => {low: number; high: number}
}

/** Nothing scores below this: `ln(0)` would sink the geometric mean whatever the weights. */
export const SCORE_FLOOR = 0.05

const MILES_PER_DEGREE = 69.0

/**
 * Same flat-earth approximation as the `radius` filter in `get-profiles`: 69 miles per degree of
 * latitude, longitude scaled by cos(lat). Accurate well past the 2000 mi ceiling the field offers.
 */
export const flatEarthMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLat = lat1 - lat2
  const dLon = (lon1 - lon2) * Math.cos((lat1 * Math.PI) / 180)
  return Math.sqrt(dLat * dLat + dLon * dLon) * MILES_PER_DEGREE
}

const hasCoords = (p: ScoringProfile) => p.city_latitude != null && p.city_longitude != null
const hasCity = (p: ScoringProfile) => !!p.city?.trim()
const normalizeCity = (city: string) => city.trim().toLowerCase()

/** 1 up to 25 mi, then a gentle log slide to a floor of 0.6 from 1600 mi. */
const distanceBase = (d: number) => 1 - 0.4 * Math.min(1, Math.log2(Math.max(d, 25) / 25) / 6)

/** Unchanged up to the cap, then progressive: ×0.67 at 1.5·M, ×0.33 at 2·M, floor from 2.5·M. */
const capFactor = (d: number, cap: number | null | undefined) =>
  cap == null ? 1 : clamp(1 - (d / cap - 1) / 1.5, SCORE_FLOOR, 1)

/** How much an unlocated partner costs someone who set a cap: 0.2 at 100 mi up to 0.7 at 2000. */
const unknownDistanceWithCap = (cap: number) =>
  clamp(0.2 + (0.5 * Math.log(cap / 100)) / Math.log(20), 0.2, 0.7)

const yearsOutsideRange = (age: number, min: number | null, max: number | null) => {
  if (min != null && age < min) return min - age
  if (max != null && age > max) return age - max
  return 0
}

const gradeYearsOutside = (years: number) =>
  years === 0 ? 1 : years <= 2 ? 0.5 : years <= 5 ? 0.2 : SCORE_FLOOR

const ageDirection = (me: ScoringProfile, other: ScoringProfile) => {
  if (me.pref_age_min == null && me.pref_age_max == null) return 1
  return gradeYearsOutside(yearsOutsideRange(other.age!, me.pref_age_min, me.pref_age_max))
}

const hasAgeRange = (p: ScoringProfile) => p.pref_age_min != null || p.pref_age_max != null

/** The `cannabis` / `psychedelics` values, from `CANNABIS_CHOICES` and `PSYCHEDELICS_CHOICES`. */
type SubstanceUse =
  | 'never_not_interested'
  | 'never_curious'
  | 'rarely'
  | 'occasionally'
  | 'regularly'

/** How well the other's usage satisfies one stated preference about it. */
const substancePrefScore = (pref: string, use: string): number => {
  const level = use as SubstanceUse
  const never = level === 'never_not_interested' || level === 'never_curious'
  switch (pref) {
    case 'not':
      return never ? 1 : level === 'rarely' ? 0.6 : level === 'occasionally' ? 0.3 : 0.1
    case 'open':
      return 1
    case 'use':
      return never ? 0.3 : level === 'rarely' ? 0.7 : 1
    default:
      return 1
  }
}

/** One direction: any of my stated preferences being met is enough, so the best of them counts. */
const substanceDirection = (prefs: string[] | null | undefined, use: string | null | undefined) => {
  if (!prefs?.length || !use) return undefined
  return max(prefs.map((p) => substancePrefScore(p, use)))!
}

const substanceFactor = (
  a: ProfileForScoring,
  b: ProfileForScoring,
  prefKey: 'cannabis_pref' | 'psychedelics_pref',
  useKey: 'cannabis' | 'psychedelics',
) => {
  const directions = [
    substanceDirection(a[prefKey], b[useKey]),
    substanceDirection(b[prefKey], a[useKey]),
  ].filter((d): d is number => d != null)
  return directions.length ? Math.min(...directions) : undefined
}

const BIG5_KEYS = [
  'big5_openness',
  'big5_conscientiousness',
  'big5_extraversion',
  'big5_agreeableness',
  'big5_neuroticism',
] as const

const hasBig5 = (p: ScoringProfile) => BIG5_KEYS.every((k) => p[k] != null)

const normalizeOptionName = (name: string) => name.trim().toLowerCase()

/**
 * Every option a member holds, across the three taxonomies, by normalised name. Interests, causes
 * and work are the same kind of thing filed under three headings, and members file the same thing
 * under different ones — "Effective altruism" is an interest to one and a cause to another — so the
 * comparison is over the union.
 */
export const getOptionBag = (p: ProfileForScoring) =>
  uniq(
    [...(p.interests_names ?? []), ...(p.causes_names ?? []), ...(p.work_names ?? [])].map(
      normalizeOptionName,
    ),
  )

export type SharedOption = {
  /** The label as the first profile spelled it. */
  name: string
  /** Which taxonomies each side filed it under. */
  tablesA: ('interests' | 'causes' | 'work')[]
  tablesB: ('interests' | 'causes' | 'work')[]
}

/** The items both hold, with where each side filed them — what the breakdown lists. */
export const getSharedOptions = (a: ProfileForScoring, b: ProfileForScoring): SharedOption[] => {
  const tablesOf = (p: ProfileForScoring, normalized: string) =>
    (['interests', 'causes', 'work'] as const).filter((table) =>
      (p[`${table}_names`] ?? []).some((n) => normalizeOptionName(n) === normalized),
    )
  const shared = intersection(getOptionBag(a), getOptionBag(b))
  const originalNames = [
    ...(a.interests_names ?? []),
    ...(a.causes_names ?? []),
    ...(a.work_names ?? []),
  ]
  return shared.map((normalized) => ({
    name: originalNames.find((n) => normalizeOptionName(n) === normalized) ?? normalized,
    tablesA: tablesOf(a, normalized),
    tablesB: tablesOf(b, normalized),
  }))
}

/** Strictness of each diet entry; "other" is unranked and so ignored. */
const DIET_RANK: Record<string, number> = {
  vegan: 3,
  veg: 2,
  pescetarian: 1,
  omnivore: 0,
  keto: 0,
  paleo: 0,
}
/** The strictest entry a side picked, or `undefined` when nothing rankable (only "other", or blank). */
const strictestDiet = (p: ScoringProfile) => {
  const ranked = (p.diet ?? []).filter((d) => DIET_RANK[d] != null)
  if (!ranked.length) return undefined
  const entry = ranked.reduce((best, d) => (DIET_RANK[d] > DIET_RANK[best] ? d : best))
  return {entry, rank: DIET_RANK[entry]}
}
const isPlantBased = (diet: {rank: number} | undefined) => diet != null && diet.rank >= 2

const EXERCISE_RANK: Record<string, number> = {rarely: 0, sometimes: 1, often: 2}
const EDUCATION_RANK: Record<string, number> = {
  'high-school': 0,
  'some-college': 1,
  bachelors: 2,
  masters: 3,
  doctorate: 4,
}

const PROMPT_WEIGHT_MAX = 8

/**
 * The registry. Order is display order in the breakdown. Weights, `u`, `prior` and `floor` are the
 * numbers in `docs/compatibility-score.md`; tune them there first.
 */
export const FACTORS: FactorDef[] = [
  {
    key: 'age',
    weight: 3,
    u: 0.15,
    prior: 0.8,
    floor: SCORE_FLOOR,
    score: (a, b) => {
      if (a.age == null || b.age == null || (!hasAgeRange(a) && !hasAgeRange(b))) return undefined
      return Math.min(ageDirection(a, b), ageDirection(b, a))
    },
  },
  {
    key: 'wants_kids',
    weight: 3,
    u: 0.15,
    prior: 0.8,
    floor: 0.6,
    score: (a, b) => {
      if (!bothSeekRelationship(a, b) || !wantsKidsAnswered(a) || !wantsKidsAnswered(b)) {
        return undefined
      }
      const diff = Math.abs(a.wants_kids_strength! - b.wants_kids_strength!)
      return diff === 0 ? 1 : diff === 1 ? 0.85 : 0.6
    },
  },
  {
    key: 'distance',
    weight: 3,
    u: 0.15,
    prior: 0.7,
    floor: SCORE_FLOOR,
    score: (a, b) => {
      if (hasCoords(a) && hasCoords(b)) {
        const d = flatEarthMiles(
          a.city_latitude!,
          a.city_longitude!,
          b.city_latitude!,
          b.city_longitude!,
        )
        const base = distanceBase(d)
        return Math.max(
          SCORE_FLOOR,
          Math.min(
            base * capFactor(d, a.pref_max_distance),
            base * capFactor(d, b.pref_max_distance),
          ),
        )
      }
      if (hasCity(a) && hasCity(b)) {
        return normalizeCity(a.city!) === normalizeCity(b.city!) ? 1 : 0.8
      }
      const located = [a, b].find((p) => hasCoords(p) || hasCity(p))
      if (!located) return undefined
      // One side unlocated: a fixed discount, deeper the tighter the located side's cap.
      return located.pref_max_distance != null
        ? unknownDistanceWithCap(located.pref_max_distance)
        : 0.7
    },
  },
  {
    key: 'availability',
    weight: 2,
    u: 0.1,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) => {
      if (!bothSeekRelationship(a, b)) return undefined
      if (!a.relationship_status?.length || !b.relationship_status?.length) return undefined
      const taken = (p: ScoringProfile) =>
        !!p.relationship_status?.some((s) => s === 'married' || s === 'long_term')
      const single = (p: ScoringProfile) => !!p.relationship_status?.includes('single')
      const nonExclusive = (p: ScoringProfile) =>
        !!p.pref_romantic_styles?.some((s) => s === 'poly' || s === 'open')
      const mismatch = (single(a) && taken(b)) || (single(b) && taken(a))
      return mismatch && !nonExclusive(a) && !nonExclusive(b) ? 0.1 : 1
    },
  },
  {
    key: 'prompts',
    // Grows with the evidence on the same curve the prompt score's own pull toward 50% shrinks on:
    // 0 at no shared answers, full at 100. With nothing shared the blank path applies, and the
    // registry weight is 2 so that its half is the 1 the doc specifies.
    weight: (_a, _b, {prompt}) => {
      const n = prompt.sharedAnswers ?? 0
      return n === 0 ? 2 : PROMPT_WEIGHT_MAX * Math.min(1, Math.sqrt(n) / 10)
    },
    u: 0,
    prior: 0.5,
    floor: SCORE_FLOOR,
    score: (_a, _b, {prompt}) => ((prompt.sharedAnswers ?? 0) > 0 ? prompt.score : undefined),
    range: (_a, _b, {prompt}) => ({
      low: prompt.low ?? prompt.score,
      high: prompt.high ?? prompt.score,
    }),
  },
  {
    key: 'religion',
    weight: 1.5,
    u: 0.1,
    prior: 0.7,
    floor: 0.4,
    score: (a, b) =>
      a.religion?.length && b.religion?.length
        ? overlaps(a.religion, b.religion)
          ? 1
          : 0.4
        : undefined,
  },
  {
    key: 'politics',
    weight: 1.5,
    u: 0.1,
    prior: 0.7,
    floor: 0.4,
    score: (a, b) =>
      a.political_beliefs?.length && b.political_beliefs?.length
        ? overlaps(a.political_beliefs, b.political_beliefs)
          ? 1
          : 0.4
        : undefined,
  },
  {
    key: 'shared_options',
    weight: 2,
    u: 0.2,
    prior: 0.6,
    floor: 0.5,
    score: (a, b) => {
      const bagA = getOptionBag(a)
      const bagB = getOptionBag(b)
      if (!bagA.length || !bagB.length) return undefined
      const jaccard = intersection(bagA, bagB).length / union(bagA, bagB).length
      return Math.min(1, 0.5 + 2 * jaccard)
    },
  },
  {
    key: 'monogamy',
    weight: 1,
    u: 0.1,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) => {
      if (!bothSeekRelationship(a, b)) return undefined
      if (!a.pref_romantic_styles?.length || !b.pref_romantic_styles?.length) return undefined
      // No overlap is a dealbreaker and never reaches here.
      const same =
        a.pref_romantic_styles.length === b.pref_romantic_styles.length &&
        intersection(a.pref_romantic_styles, b.pref_romantic_styles).length ===
          a.pref_romantic_styles.length
      return same ? 1 : 0.8
    },
  },
  {
    key: 'cannabis',
    weight: 1,
    u: 0.15,
    prior: 0.8,
    floor: 0.1,
    score: (a, b) => substanceFactor(a, b, 'cannabis_pref', 'cannabis'),
  },
  {
    key: 'psychedelics',
    weight: 1,
    u: 0.15,
    prior: 0.8,
    floor: 0.1,
    score: (a, b) => substanceFactor(a, b, 'psychedelics_pref', 'psychedelics'),
  },
  {
    key: 'big5',
    weight: 1,
    u: 0.2,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) =>
      hasBig5(a) && hasBig5(b)
        ? 1 - mean(BIG5_KEYS.map((k) => Math.abs(a[k]! - b[k]!))) / 100
        : undefined,
  },
  {
    key: 'smoking',
    weight: 0.5,
    u: 0.1,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) =>
      a.is_smoker != null && b.is_smoker != null
        ? a.is_smoker === b.is_smoker
          ? 1
          : 0.5
        : undefined,
  },
  {
    key: 'drinking',
    weight: 0.5,
    u: 0.15,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) =>
      a.drinks_per_month != null && b.drinks_per_month != null
        ? 1 - (0.6 * Math.min(Math.abs(a.drinks_per_month - b.drinks_per_month), 20)) / 20
        : undefined,
  },
  {
    key: 'diet',
    // Core to most vegans and vegetarians, incidental to most omnivores.
    weight: (a, b) => (isPlantBased(strictestDiet(a)) || isPlantBased(strictestDiet(b)) ? 2 : 0.5),
    u: 0.15,
    prior: 0.75,
    floor: 0.3,
    score: (a, b) => {
      const da = strictestDiet(a)
      const db = strictestDiet(b)
      if (!da || !db) return undefined
      if (isPlantBased(da) || isPlantBased(db)) {
        const lower = Math.min(da.rank, db.rank)
        if (lower >= 2) return da.rank === db.rank ? 1 : 0.9
        return lower === 1 ? 0.6 : 0.3
      }
      return da.entry === db.entry ? 0.8 : 0.7
    },
  },
  {
    key: 'exercise',
    weight: 0.5,
    u: 0.15,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) => {
      const ra = a.exercise ? EXERCISE_RANK[a.exercise] : undefined
      const rb = b.exercise ? EXERCISE_RANK[b.exercise] : undefined
      if (ra == null || rb == null) return undefined
      const diff = Math.abs(ra - rb)
      return diff === 0 ? 1 : diff === 1 ? 0.8 : 0.5
    },
  },
  {
    key: 'education',
    weight: 0.5,
    u: 0.15,
    prior: 0.8,
    floor: 0.5,
    score: (a, b) => {
      const ra = a.education_level ? EDUCATION_RANK[a.education_level] : undefined
      const rb = b.education_level ? EDUCATION_RANK[b.education_level] : undefined
      if (ra == null || rb == null) return undefined
      const diff = Math.abs(ra - rb)
      return diff <= 1 ? 1 : diff === 2 ? 0.8 : 0.6
    },
  },
  {
    key: 'languages',
    weight: 2,
    u: 0.1,
    prior: 0.9,
    floor: 0.1,
    score: (a, b) =>
      a.languages?.length && b.languages?.length
        ? overlaps(a.languages, b.languages)
          ? 1
          : 0.1
        : undefined,
  },
]

const evaluateFactor = (
  def: FactorDef,
  a: ProfileForScoring,
  b: ProfileForScoring,
  ctx: FactorContext,
): FactorResult => {
  const weight = typeof def.weight === 'function' ? def.weight(a, b, ctx) : def.weight
  const score = def.score(a, b, ctx)
  if (score == null) {
    return {score: def.prior, low: def.floor, high: 1, weight: weight / 2, blank: true}
  }
  const range = def.range?.(a, b, ctx) ?? {low: score - def.u, high: score + def.u}
  return {
    score,
    low: clamp(Math.min(range.low, score), SCORE_FLOOR, 1),
    high: clamp(Math.max(range.high, score), SCORE_FLOOR, 1),
    weight,
    blank: false,
  }
}

/** Weighted geometric mean, every term floored so one zero cannot swallow the rest. */
const weightedGeometricMean = (items: {value: number; weight: number}[]) => {
  const totalWeight = sumBy(items, 'weight')
  if (totalWeight <= 0) return 0.5
  const logSum = sumBy(items, (i) => i.weight * Math.log(Math.max(i.value, SCORE_FLOOR)))
  return Math.exp(logSum / totalWeight)
}

// ---------------------------------------------------------------------------------------------------
// Overall
// ---------------------------------------------------------------------------------------------------

/**
 * How the prompt side reaches the function: both answer sets (the backend recompute, which runs
 * `getCompatibilityScore`), an already computed prompt score (the browser, from the API), or nothing
 * at all (no stored prompt score — scored as zero shared answers).
 */
export type PromptInput =
  | {answersA: AnswerForScoring[]; answersB: AnswerForScoring[]}
  | Pick<CompatibilityScore, 'score' | 'low' | 'high' | 'sharedAnswers'>
  | undefined

export type ScoredCompatibility = {
  kind: 'scored'
  score: number
  low: number
  high: number
  sharedAnswers: number
  confidence: CompatibilityScore['confidence']
  /** The prompt-only score, when the pair shares at least one answered prompt. */
  prompt?: {score: number; low: number; high: number}
  factors: Record<FactorKey, FactorResult>
}

export type OverallCompatibility =
  | {kind: 'dealbreaker'; dealbreakers: DealbreakerKey[]}
  | ScoredCompatibility

const resolvePrompt = (input: PromptInput): CompatibilityScore => {
  if (!input) return {score: 0.5, low: 0, high: 1, sharedAnswers: 0, confidence: 'low'}
  if ('answersA' in input) return getCompatibilityScore(input.answersA, input.answersB)
  const n = input.sharedAnswers ?? 0
  return {
    score: input.score,
    low: input.low,
    high: input.high,
    sharedAnswers: n,
    confidence: n < 10 ? 'low' : n < 100 ? 'medium' : 'high',
  }
}

export const getOverallCompatibility = (
  a: ProfileForScoring,
  b: ProfileForScoring,
  promptInput: PromptInput,
): OverallCompatibility => {
  const dealbreakers = getDealbreakers(a, b)
  if (dealbreakers.length) return {kind: 'dealbreaker', dealbreakers}

  const prompt = resolvePrompt(promptInput)
  const ctx: FactorContext = {prompt}
  const factors = Object.fromEntries(
    FACTORS.map((def) => [def.key, evaluateFactor(def, a, b, ctx)]),
  ) as Record<FactorKey, FactorResult>

  const all = Object.values(factors)
  const score = weightedGeometricMean(all.map((f) => ({value: f.score, weight: f.weight})))
  const low = weightedGeometricMean(all.map((f) => ({value: f.low, weight: f.weight})))
  const high = weightedGeometricMean(all.map((f) => ({value: f.high, weight: f.weight})))
  const sharedAnswers = prompt.sharedAnswers ?? 0

  return {
    kind: 'scored',
    score,
    low: Math.min(low, score),
    high: Math.max(high, score),
    sharedAnswers,
    confidence: prompt.confidence,
    prompt: factors.prompts.blank
      ? undefined
      : {score: prompt.score, low: prompt.low ?? prompt.score, high: prompt.high ?? prompt.score},
    factors,
  }
}
