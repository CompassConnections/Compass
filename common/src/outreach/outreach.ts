import {clamp, sumBy} from 'lodash'

/**
 * Where a one-to-one conversation with a member stands. Set by hand: it depends on what was actually
 * said, which no query can infer. Absence of a row means whatever `getEffectiveStage` says it means —
 * `not_started` for someone never written to, `opened` for someone already written to.
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

/**
 * The stage to treat a member as being at when nothing is stored for them.
 *
 * A stored stage always wins — the whole point of the column is that it records what a query cannot
 * infer. But the *absence* of one is not evidence of `not_started` once there is a thread you have
 * written in: it means the row was never filled in, and showing "Not started" next to a conversation
 * you opened weeks ago is the dashboard contradicting itself. The one thing a query can infer about
 * the stage is that a message you sent opened it, so that is the only inference made here.
 *
 * Nothing is written to `outreach_contacts` on the strength of this. It is what the queue shows before
 * anyone has said otherwise, and what the stats bucket a member into — so the `not_started` line stays
 * what it claims to be: members nobody has written to.
 */
export const getEffectiveStage = (stage: OutreachStage | null, contacted: boolean): OutreachStage =>
  stage ?? (contacted ? 'opened' : 'not_started')

export const MAX_NEXT_ACTION_LENGTH = 200

/** Derived from the thread, never stored. */
export type OutreachStatus = 'needs_reply' | 'not_contacted' | 'awaiting_reply' | 'dormant'

/** A thread with no message either way for this long is dormant rather than merely pending. */
export const DORMANT_AFTER_DAYS = 30

/** Tier A is worth founder time first, C is a profile too thin to act on yet. */
export type OutreachTier = 'A' | 'B' | 'C'

/**
 * The radius every honest local number is quoted at.
 *
 */
export const OUTREACH_RADIUS_KM = 322

/**
 * Fewer than this many members within `OUTREACH_RADIUS_KM` and the room is empty enough to say so.
 *
 * Strictly below, so that this and the share email's `MIN_NEARBY_COUNT` partition the population
 * exactly: nobody is eligible for both "there are N people near you" and "there is nobody near you".
 */
export const EMPTY_ROOM_MAX_NEARBY = 5

/** No sign of them for this long is the other way into Contact #E. */
export const EMPTY_ROOM_INACTIVE_DAYS = 14

/** Members within `OUTREACH_RADIUS_KM` of this member, and who they are. */
export type LocalDensity = {
  count: number
  city: string | null
  /** A handful of the nearest, for the "link three profiles" version of the ask. */
  nearby: {name: string; username: string}[]
}

/**
 * The moments the doc says willingness peaks — each one a reason the ask is credible *now* rather
 * than on whatever day the calendar reached.
 *
 * Deriving these is the whole point: a date is a proxy for "value has probably landed by now", and
 * these are the events the proxy was standing in for. The profile-view trigger from the doc is absent
 * because profile views are not recorded anywhere yet.
 */
export const OUTREACH_TRIGGERS = [
  'search_alert_fired',
  'first_reply_received',
  'sent_first_message',
  'empty_room',
] as const

export type OutreachTrigger = (typeof OUTREACH_TRIGGERS)[number]

export const OUTREACH_TRIGGER_LABELS: Record<OutreachTrigger, string> = {
  search_alert_fired: 'Alert fired',
  first_reply_received: 'Got a reply',
  sent_first_message: 'Wrote to someone',
  empty_room: 'Empty room',
}

/** The longer version, shown on hover — what happened, and what it licenses. */
export const OUTREACH_TRIGGER_DESCRIPTIONS: Record<OutreachTrigger, string> = {
  search_alert_fired: 'A saved-search alert reached them — the product visibly worked. Ask now.',
  first_reply_received:
    'Another member wrote back to them. Highest-emotion moment on the platform. Ask now.',
  sent_first_message: "They've written to someone, so they're committed. #2 or #3.",
  empty_room: 'Under 5 members near them, or two weeks quiet. This is Contact #E, not the ask.',
}

/**
 * `empty_room` is the one trigger that argues *against* the normal ask: there is nothing to be
 * enthusiastic about, and #3's "bringing two people improves your odds" reads as a deflection when
 * the honest number is two. It gets #E instead, which says the same thing without pretending.
 */
export const isAskReadyTrigger = (trigger: OutreachTrigger) => trigger !== 'empty_room'

/**
 * The fields that decide whether a member is findable by someone searching. Deliberately not every
 * column on `profiles` — a missing height says nothing, a missing bio says the free-text search has
 * nothing to match on.
 */
export type ProfileCompletenessInput = {
  bioLength: number | null
  headline: string | null
  photoCount: number
  /** A pinned image counts as their photo — it is what the profile actually shows. */
  pinnedUrl?: string | null
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
    ['photo', p.photoCount > 0 || !!p.pinnedUrl],
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

/** The "who I'm looking for" fields of a member's own profile. */
export type LookingForPrefs = {
  prefAgeMin: number | null
  prefAgeMax: number | null
  /** Genders they want to meet. */
  prefGender: string[] | null
  /** Connection goal — collaboration / friendship / relationship. */
  prefRelationStyles: string[] | null
}

/** What a search created on a member's behalf is called in their saved-searches list. */
export const OUTREACH_SEARCH_NAME = 'Who I’m looking for'

/**
 * The saved search a member would have written for themselves, from the preferences they already
 * stated on their profile.
 *
 * The three filter keys are not the three profile columns, and the mismatch is deliberate — the
 * search query reads them from opposite sides:
 *
 * - `genders` matches the candidate's *own* gender, so their `pref_gender` goes here.
 * - `pref_age_min/max` bound the candidate's *age* (see `numericRangeClause('age', ...)` in
 *   `get-profiles`), so their age range maps across unchanged despite the shared name.
 * - `pref_relation_styles` is the one true overlap check: candidates wanting the same kind of
 *   connection, plus everyone who left the field blank.
 *
 * Returns null when they stated nothing at all — a search with no filters is the whole directory,
 * which is not an alert anyone wants.
 */
export const getLookingForSearchFilters = (p: LookingForPrefs) => {
  const filters: Record<string, unknown> = {}

  if (p.prefGender?.length) filters.genders = p.prefGender
  if (p.prefRelationStyles?.length) filters.pref_relation_styles = p.prefRelationStyles
  if (p.prefAgeMin !== null) filters.pref_age_min = p.prefAgeMin
  if (p.prefAgeMax !== null) filters.pref_age_max = p.prefAgeMax

  return Object.keys(filters).length ? filters : null
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

/**
 * The automated messages whose sends are logged in `outreach_sends`.
 *
 * Mirrors the CHECK constraint in `20260803_add_outreach_sends.sql`. It lives here rather than in
 * `backend/shared` because the stats endpoint returns these keys to the dashboard, and the wire type
 * has to be nameable from both sides.
 */
export const OUTREACH_SEND_KINDS = ['city_number', 'empty_room'] as const

export type OutreachSendKind = (typeof OUTREACH_SEND_KINDS)[number]

export const OUTREACH_SEND_KIND_LABELS: Record<OutreachSendKind, string> = {
  city_number: 'City-number email',
  empty_room: 'Empty room (#E)',
}

/**
 * What the members of one bucket — a stage, or an automated send — actually went on to do.
 *
 * Every count is a *measured* behaviour, never a hand-set field: the stage says what was intended,
 * these say what happened. That is the whole point of the panel, since the stage is set by the same
 * person whose work it would otherwise be scoring.
 *
 * All four are lifetime, not "since the stage was set". A stage carries no reliable timestamp of when
 * it began (`outreach_contacts.updated_time` moves on every edit), so a time-scoped version would be
 * available for automated sends and guesswork for everything else — and the comparison between those
 * two is exactly what the panel exists to make. One imperfect definition applied consistently beats
 * two that cannot be read against each other.
 */
export type OutreachOutcomes = {
  /** Members in this bucket. Denominator for every rate below. */
  members: number
  /** Wrote back in the founder thread — the outreach message landed. */
  repliedToUs: number
  /** Sent a message to another member. The product working, rather than the founder working. */
  messagedMember: number
  /** Another member wrote to them: they are findable, whether or not they acted on it. */
  heardFromMember: number
  /** At least one member joined naming them as referrer — Contact #3's ask, answered. */
  broughtSomeone: number
}

/**
 * Outcome rates for every stage side by side, plus the same rates for the automated sends.
 *
 * The two halves are what makes it readable: the automated rows are the control the hand-written
 * stages are worth measuring against, and `not_started` is the control for both — members nobody has
 * written to. None of it is a controlled experiment (the queue is deliberately worked best-first, so
 * the deeper stages start from better members), which is why these are rates to compare, not credit
 * to claim.
 */
export type OutreachStats = {
  stages: ({stage: OutreachStage} & OutreachOutcomes)[]
  sends: ({kind: OutreachSendKind} & OutreachOutcomes)[]
}

/** Percentage of `total` that `n` is, rounded, and 0 when the bucket is empty. */
export const outcomeRate = (n: number, total: number) => (total ? Math.round((100 * n) / total) : 0)

/** Sum of a set of buckets, for the "all members" line the per-stage rows are read against. */
export const sumOutcomes = (rows: OutreachOutcomes[]): OutreachOutcomes => ({
  members: sumBy(rows, 'members'),
  repliedToUs: sumBy(rows, 'repliedToUs'),
  messagedMember: sumBy(rows, 'messagedMember'),
  heardFromMember: sumBy(rows, 'heardFromMember'),
  broughtSomeone: sumBy(rows, 'broughtSomeone'),
})

/** One member as the outreach queue sees them: stored state plus everything derived at query time. */
export type OutreachRow = {
  user: {id: string; name: string; username: string; avatarUrl?: string}
  /** What was stored by hand, if anything. Read it through `getEffectiveStage`, not directly. */
  stage: OutreachStage | null
  /**
   * You have sent them at least one message. Stricter than "a thread exists" on purpose: a member who
   * wrote to you first has not been contacted by you, and their stage should still read `not_started`
   * — what is owed there is a reply, not an opening.
   */
  contacted: boolean
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
  /** Null when they have no city set, so no honest local number can be quoted at them. */
  localDensity: LocalDensity | null
  /** Which of the peak-willingness events have fired for them. */
  triggers: OutreachTrigger[]
}
