/**
 * The public feed of new profiles — served as RSS at `/feed.xml`, and the projection an ActivityPub
 * actor would publish later if the RSS→AP bridge shows anyone is reading.
 *
 * Two settings gate an item, and they are deliberately separate:
 *
 * - `profiles.visibility` — who may read the profile page. Only `public` profiles are ever syndicated.
 * - `profiles.feed_visibility` — how much of a public profile may leave the site. Syndication is
 *   un-retractable in a way a web page is not: once a post has federated, deleting it here does not
 *   delete the copies. So "my profile is public" must not silently mean "broadcast me".
 *
 * `feed_visibility` only ever narrows. A members-only profile stays out of the feed whatever it says.
 */

export const FEED_VISIBILITY_LEVELS = ['none', 'basic', 'full'] as const

export type FeedVisibility = (typeof FEED_VISIBILITY_LEVELS)[number]

/** Matches the column default in 20260806_add_feed_visibility_to_profiles.sql. */
export const DEFAULT_FEED_VISIBILITY: FeedVisibility = 'basic'

/**
 * A feed entry is an invitation to open the profile, not a copy of it — so the excerpt stops well short
 * of the whole bio even at `full`.
 */
export const MAX_FEED_BIO_CHARS = 400

/** Items per feed response. Enough for a bridge polling daily to never miss anyone. */
export const DEFAULT_FEED_LIMIT = 50
export const MAX_FEED_LIMIT = 200

/**
 * One syndicated profile. Every field beyond `username`/`name`/`createdTime` is optional because the
 * *server* drops what the member's level does not allow — the renderer never has to know the level, and
 * no endpoint can leak a `full` field for a `basic` profile by forgetting a check.
 *
 * `createdTime` is an ISO string rather than a `Date`: it crosses the wire as JSON and is only ever
 * reformatted (to RFC-822) on the way into the feed.
 */
export type FeedItem = {
  username: string
  name: string
  createdTime: string
  /** `basic` and up. */
  headline?: string
  /** `basic` and up — "Rome, Italy", or just the country when no city is set. */
  location?: string
  /**
   * `basic` and up. Keywords are self-chosen labels rather than anything the profile reveals about a
   * person, and they are what makes an entry findable by someone scanning a timeline — the fediverse
   * reads them the way it reads hashtags.
   */
  keywords?: string[]
  /** `full` only. */
  gender?: string
  /** `full` only — plain text, truncated to {@link MAX_FEED_BIO_CHARS} at a word boundary. */
  bioExcerpt?: string
}

/**
 * What `feed_visibility` should become when a member switches their profile to members-only, or
 * `undefined` to leave it as it is.
 *
 * Going members-only is a request to stop being on the open web, and being syndicated is the most
 * open-web thing the profile does — so someone who never touched the feed setting (still on the
 * default) gets switched off rather than left queued for the next bridge poll. An explicit `full` is a
 * deliberate choice and is left alone; the feed excludes members-only profiles anyway, so nothing
 * leaks either way. Deliberately one-way: switching back to public does not re-enable syndication,
 * because reversing a privacy choice on someone's behalf is the error that actually costs something.
 */
export function feedVisibilityForMembersOnly(
  current: FeedVisibility | null | undefined,
): FeedVisibility | undefined {
  return (current ?? DEFAULT_FEED_VISIBILITY) === DEFAULT_FEED_VISIBILITY ? 'none' : undefined
}

/** Cut to `max` characters on a word boundary, with an ellipsis when anything was dropped. */
export function truncateAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  // A single word longer than the whole budget has no boundary to fall back to; cut it mid-word rather
  // than returning an empty excerpt.
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-–—]+$/, '')}…`
}
