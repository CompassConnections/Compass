/**
 * When to show a member Martin's "help Compass grow" video — the ask to share Compass or donate.
 *
 * Deliberately shaped like `common/src/reviews/prompt.ts`, and reusing its idea of a good moment: the
 * member has just felt Compass work. Unlike the store review card, this dialog is ours, so it runs on
 * every platform (web included) and it may look at sentiment — the rules against sentiment gating
 * cover store review cards only. The reasoning is in `docs/share-prompt.md`.
 */

/**
 * Whether the video exists yet. False until it has been recorded, uploaded to R2 and added to
 * `web/scripts/fetch-media.mjs` — until then neither the prompt nor the /referrals section renders.
 */
export const SHARE_VIDEO_AVAILABLE = true

/** File name under `public/videos/`. Versioned so a re-record never fights a cached copy. */
export const SHARE_VIDEO_FILE = 'share-ask-v1.mp4'

/** The behavioural moment that earned the ask. Mirrored by a CHECK constraint on `share_prompts`. */
export const SHARE_TRIGGERS = ['got-reply', 'testimonial', 'established'] as const

export type ShareTrigger = (typeof SHARE_TRIGGERS)[number]

/**
 * Where the app was when it asked. As with reviews, a place rather than a claim: only the server can
 * tell whether the moment earned anything.
 */
export const SHARE_MOMENTS = ['conversation-exit', 'testimonial-submitted', 'quiet'] as const

export type ShareMoment = (typeof SHARE_MOMENTS)[number]

export const SHARE_PLATFORMS = ['web', 'ios', 'android'] as const

export type SharePlatform = (typeof SHARE_PLATFORMS)[number]

/** At most once every 60 days, and three times ever. */
export const SHARE_PROMPT_COOLDOWN_DAYS = 60
export const SHARE_PROMPT_MAX_ATTEMPTS = 3

/** Never in the first sessions on a device: they have to have seen enough to have an opinion. */
export const SHARE_PROMPT_MIN_SESSIONS = 3

/** A testimonial at or above this rating (or with none) earns the ask. */
export const SHARE_TESTIMONIAL_MIN_RATING = 4

const DAY_MS = 24 * 60 * 60 * 1000

/** What only the database knows. Gathered by `request-share-prompt` in one query. */
export type ShareAccountFacts = {
  /** How many times this member has been shown the video, ever. */
  attempts: number
  lastPromptedAt: Date | null
  /** On hold or banned. */
  suppressed: boolean
  /** A conversation reached two-way exchange recently — the review prompt's `got-reply` test. */
  hasRecentReply: boolean
  /** Rating of their own testimonial: undefined when they have none, null when they gave no stars. */
  testimonialRating: number | null | undefined
  /** Any two-way conversation or any testimonial, at any time. */
  hasAnyEvidence: boolean
  now: Date
}

/**
 * The server's half of the rules, and the mapping from a moment to a trigger. Returns the trigger to
 * record, or null to stay quiet. Suppression comes first so no moment can route around it.
 */
export function evaluateSharePrompt(
  moment: ShareMoment,
  facts: ShareAccountFacts,
): ShareTrigger | null {
  if (facts.suppressed) return null
  if (facts.attempts >= SHARE_PROMPT_MAX_ATTEMPTS) return null
  if (
    facts.lastPromptedAt &&
    (facts.now.getTime() - facts.lastPromptedAt.getTime()) / DAY_MS < SHARE_PROMPT_COOLDOWN_DAYS
  ) {
    return null
  }

  switch (moment) {
    case 'conversation-exit':
      return facts.hasRecentReply ? 'got-reply' : null
    case 'testimonial-submitted': {
      const rating = facts.testimonialRating
      if (rating === undefined) return null
      return rating === null || rating >= SHARE_TESTIMONIAL_MIN_RATING ? 'testimonial' : null
    }
    case 'quiet':
      // A one-shot catch-up for members who already had the experience before this shipped.
      return facts.attempts === 0 && facts.hasAnyEvidence ? 'established' : null
  }
}

/** The install-local half: enough sessions on this device. */
export function isShareInstallEligible(sessions: number) {
  return sessions >= SHARE_PROMPT_MIN_SESSIONS
}
