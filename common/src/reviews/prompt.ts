import {ANDROID_APP_URL, IOS_APP_URL, IS_IOS_APP_PUBLISHED} from 'common/constants'

/**
 * When to ask a member of the iOS or Android app to rate Compass on the store.
 *
 * Every threshold and both decisions live here so that the whole policy can be read in one place and
 * tested without a database or a WebView. The reasoning behind each number — and the store policies
 * that constrain them — is in `docs/app-store-reviews.md`.
 *
 * The one thing to keep in mind while reading: the store APIs report *nothing* back. `requestReview()`
 * resolves the same way whether a review was written, the card was dismissed, or the card never
 * rendered at all because the member's per-year quota was spent. Nothing downstream can react to the
 * outcome, so every rule here is a decision made up front, and every one of them errs towards not
 * asking.
 */

/** The behavioural moment that earned the ask. Mirrored by a CHECK constraint on `review_prompts`. */
export const REVIEW_TRIGGERS = [
  'got-reply',
  'testimonial',
  'notification-profile',
  'backfill',
] as const

export type ReviewTrigger = (typeof REVIEW_TRIGGERS)[number]

/**
 * Where the app was when it asked, which is all the client claims to know.
 *
 * Deliberately not the same list as `REVIEW_TRIGGERS`: `inbox` is a place, `got-reply` is a fact about
 * the member's conversations that only the server can check. Keeping them apart is what stops the
 * client from asserting it has earned a prompt.
 */
export const REVIEW_MOMENTS = [
  'inbox',
  'testimonial-submitted',
  'profile-from-notification',
  'quiet',
] as const

export type ReviewMoment = (typeof REVIEW_MOMENTS)[number]

export type ReviewPlatform = 'ios' | 'android'

/**
 * Lifetime cap and cooldown, set to the tighter of the two platforms so that no rule has to branch on
 * one. Apple hard-caps at 3 prompts per device per 365 days and silently no-ops past that; Play's
 * quota is undocumented but similarly small. Asking a fourth time would not reach anyone anyway — it
 * would only cost us the record of having tried.
 */
export const REVIEW_PROMPT_MAX_ATTEMPTS = 3
export const REVIEW_PROMPT_COOLDOWN_DAYS = 120

/** Never in the first session, and never on the day of install. */
export const REVIEW_PROMPT_MIN_SESSIONS = 3
export const REVIEW_PROMPT_MIN_DAYS_INSTALLED = 2

/**
 * Backfill is a one-shot for members whose qualifying moment happened before the feature existed, so
 * it waits for less. Still not the first session: a card on first launch reads as a shakedown.
 */
export const REVIEW_PROMPT_BACKFILL_MIN_SESSIONS = 2

/** A support message, or a report they filed, poisons the well for this long. */
export const REVIEW_SUPPRESSION_DAYS = 14

/**
 * What counts as genuine two-way exchange in one conversation: someone wrote back twice, or the thread
 * ran to four messages between them. Either way it is past the point where one side is talking to
 * themselves, which is the only thing being tested.
 */
export const REVIEW_REPLY_INBOUND_MIN = 2
export const REVIEW_CONVERSATION_TOTAL_MIN = 4

/** How recently that exchange has to have happened for the inbox to still be the right moment. */
export const REVIEW_REPLY_RECENT_DAYS = 7

/**
 * The line between "we missed this one" and "this one will fire on its own".
 *
 * Backfill only looks at evidence older than this, so an event after it reaches the member through its
 * own trigger instead of being asked about twice. Set it to the date the feature actually ships — see
 * `docs/app-store-reviews.md` §8.
 */
export const REVIEW_BACKFILL_CUTOFF = new Date('2026-08-24T00:00:00Z')

const DAY_MS = 24 * 60 * 60 * 1000

const daysBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / DAY_MS

/** What the install itself knows, read from `localStorage`. Meaningless server-side. */
export type ReviewInstallFacts = {
  /** App launches since the app was installed, this one included. */
  sessions: number
  /** First launch we ever saw on this install. */
  firstSeen: Date
  now: Date
}

/**
 * The half of the rules the app can answer on its own.
 *
 * Sessions and install age are facts about *this install*, and they have no server-side meaning — the
 * same member on a new phone genuinely is a new install and should serve the same wait before being
 * asked. Which is also why losing them to cleared WebView storage is harmless: it delays a prompt, it
 * never duplicates one, because the count that must not be lost lives in `review_prompts`.
 */
export function isInstallEligible(moment: ReviewMoment, facts: ReviewInstallFacts) {
  const minSessions =
    moment === 'quiet' ? REVIEW_PROMPT_BACKFILL_MIN_SESSIONS : REVIEW_PROMPT_MIN_SESSIONS

  if (facts.sessions < minSessions) return false
  if (daysBetween(facts.firstSeen, facts.now) < REVIEW_PROMPT_MIN_DAYS_INSTALLED) return false

  return true
}

/** What only the database knows. Gathered by `request-review-prompt` in one query. */
export type ReviewAccountFacts = {
  /** How many times this member has been shown the card, ever. */
  attempts: number
  lastPromptedAt: Date | null
  /**
   * On hold or banned, or they wrote to support or filed a report inside the suppression window.
   * Collapsed to one flag because nothing downstream distinguishes them: any of them means today is
   * not the day to ask for five stars.
   */
  recentlyUpset: boolean
  /** A conversation reached two-way exchange within `REVIEW_REPLY_RECENT_DAYS`. */
  hasRecentReply: boolean
  /** A conversation or a testimonial that predates `REVIEW_BACKFILL_CUTOFF`. */
  hasPreCutoffEvidence: boolean
  now: Date
}

/**
 * The half of the rules only the server can answer, and the mapping from a moment to a trigger.
 *
 * Returns the trigger to record, or null to stay quiet. Suppression is checked before the moment is
 * even looked at, so adding a moment cannot accidentally route around it.
 */
export function evaluateReviewPrompt(
  moment: ReviewMoment,
  facts: ReviewAccountFacts,
): ReviewTrigger | null {
  if (facts.recentlyUpset) return null
  if (facts.attempts >= REVIEW_PROMPT_MAX_ATTEMPTS) return null
  if (
    facts.lastPromptedAt &&
    daysBetween(facts.lastPromptedAt, facts.now) < REVIEW_PROMPT_COOLDOWN_DAYS
  ) {
    return null
  }

  switch (moment) {
    case 'inbox':
      return facts.hasRecentReply ? 'got-reply' : null
    case 'testimonial-submitted':
      return 'testimonial'
    case 'profile-from-notification':
      return 'notification-profile'
    case 'quiet':
      // Backfill is only ever for members the feature was too late for. A member who has already been
      // asked once has been caught up by definition, whatever the outcome was.
      return facts.attempts === 0 && facts.hasPreCutoffEvidence ? 'backfill' : null
  }
}

/**
 * Where a member-initiated "Rate Compass" control should go, or null if there is nowhere to send them.
 *
 * This is the one place linking out to the store is right. On iOS it is in fact the *only* correct
 * mechanism for an explicit control: Apple's HIG forbids calling `requestReview` from a button tap,
 * and the `action=write-review` deep link is what it points to instead. Play has no documented
 * write-review anchor, so Android gets the listing.
 *
 * Null on iOS until the App Store assigns the id — `IOS_APP_URL` is a placeholder until then, and a
 * hidden row beats a row that 404s.
 */
export function storeReviewUrl(platform: ReviewPlatform): string | null {
  if (platform === 'android') return ANDROID_APP_URL
  return IS_IOS_APP_PUBLISHED ? `${IOS_APP_URL}?action=write-review` : null
}
