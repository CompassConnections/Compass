import {clamp} from 'lodash'

/**
 * Where a one-to-one conversation with a member stands. Set by hand: it depends on what was actually
 * said, which no query can infer. Absence of a row means `not_started`.
 *
 * `excluded` takes a member out of the queue for good — people already known personally, test
 * accounts, anyone outreach does not apply to.
 */
export const OUTREACH_STAGES = [
  'not_started',
  'opened',
  'replied',
  'suggestions_sent',
  'nudged',
  'closed',
  'excluded',
] as const

export type OutreachStage = (typeof OUTREACH_STAGES)[number]

export const OUTREACH_STAGE_LABELS: Record<OutreachStage, string> = {
  not_started: 'Not started',
  opened: 'Opened',
  replied: 'Replied',
  suggestions_sent: 'Suggestions sent',
  nudged: 'Nudged',
  closed: 'Closed',
  excluded: 'Excluded',
}

export const MAX_NEXT_ACTION_LENGTH = 200

/** Derived from the thread, never stored. */
export type OutreachStatus = 'needs_reply' | 'not_contacted' | 'awaiting_reply' | 'dormant'

/** A thread with no message either way for this long is dormant rather than merely pending. */
export const DORMANT_AFTER_DAYS = 30

/** Tier A is worth founder time first, C is a profile too thin to act on yet. */
export type OutreachTier = 'A' | 'B' | 'C'

/**
 * The fields that decide whether a member is findable by someone searching. Deliberately not every
 * column on `profiles` — a missing height says nothing, a missing bio says the free-text search has
 * nothing to match on.
 */
export type ProfileCompletenessInput = {
  bioLength: number | null
  headline: string | null
  photoCount: number
  occupation: string | null
  educationLevel: string | null
  politicalBeliefs: string[] | null
  diet: string[] | null
  languages: string[] | null
  city: string | null
  prefGender: string[] | null
  interestCount: number
  causeCount: number
  compatibilityAnswerCount: number
  hasBig5: boolean
}

/** Below this a bio is a one-liner: present, but not something search or a reader can use. */
const MIN_USEFUL_BIO_LENGTH = 200

const hasAny = (v: string[] | null | undefined) => !!v && v.length > 0

export type ProfileCompleteness = {
  /** 0–1. */
  score: number
  filled: number
  total: number
  /** Field keys still empty, in the order below — the list to hand back as concrete advice. */
  missing: string[]
}

export const getProfileCompleteness = (p: ProfileCompletenessInput): ProfileCompleteness => {
  const checks: [string, boolean][] = [
    ['bio', (p.bioLength ?? 0) >= MIN_USEFUL_BIO_LENGTH],
    ['headline', !!p.headline],
    ['photo', p.photoCount > 0],
    ['occupation', !!p.occupation],
    ['education', !!p.educationLevel],
    ['politics', hasAny(p.politicalBeliefs)],
    ['diet', hasAny(p.diet)],
    ['languages', hasAny(p.languages)],
    ['city', !!p.city],
    ['looking for', hasAny(p.prefGender)],
    ['interests', p.interestCount >= 3],
    ['causes', p.causeCount >= 3],
    ['compatibility', p.compatibilityAnswerCount >= 5],
    ['big five', p.hasBig5],
  ]

  const missing = checks.filter(([, ok]) => !ok).map(([key]) => key)
  const filled = checks.length - missing.length

  return {score: filled / checks.length, filled, total: checks.length, missing}
}

export type OutreachTierInput = {
  completeness: number
  daysSinceLastOnline: number | null
  repliedToUs: boolean
  savedSearchCount: number
}

/**
 * Completeness sets the baseline; engagement moves it one step either way. A thin profile from
 * someone who writes back is worth more than a full profile from someone who signed up and left, and
 * neither is captured by completeness alone.
 */
export const getOutreachTier = (p: OutreachTierInput): OutreachTier => {
  const base = p.completeness >= 0.65 ? 2 : p.completeness >= 0.35 ? 1 : 0

  const engaged =
    p.repliedToUs ||
    p.savedSearchCount > 0 ||
    (p.daysSinceLastOnline !== null && p.daysSinceLastOnline <= 7)

  const stale = p.daysSinceLastOnline === null || p.daysSinceLastOnline > DORMANT_AFTER_DAYS

  const level = clamp(base + (engaged ? 1 : 0) - (stale ? 1 : 0), 0, 2)

  return (['C', 'B', 'A'] as const)[level]
}

/** One member as the outreach queue sees them: stored state plus everything derived at query time. */
export type OutreachRow = {
  user: {id: string; name: string; username: string; avatarUrl?: string}
  stage: OutreachStage | null
  nextAction: string | null
  status: OutreachStatus
  tier: OutreachTier
  completeness: ProfileCompleteness
  daysSinceSignup: number
  daysSinceLastOnline: number | null
  /** Days since the last message in the thread, whoever sent it. Null when there is no thread. */
  daysSinceLastMessage: number | null
  channelId: number | null
  savedSearchCount: number
  /** How many members joined with this member's username as their referrer. */
  referredCount: number
}
