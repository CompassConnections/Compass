/**
 * The public feed of new profiles — served as RSS at `/feed.xml`, and the projection an ActivityPub
 * actor would publish later if the RSS→AP bridge shows anyone is reading.
 *
 * One rule gates an item: the feed carries the fields a member shows to everyone
 * (docs/profile-visibility.md), and never photos. There used to be a second, feed-only setting
 * (`profiles.feed_visibility`: none / basic / full) on the reasoning that syndication is
 * un-retractable in a way a web page is not. It was removed when visibility became per field: a
 * member who does not want something broadcast now sets that field to members, which also takes it
 * off the open web.
 */

/** The profile fields a feed item can carry. A profile is in the feed when any of them is public. */
export const FEED_FIELDS = ['headline', 'location', 'keywords', 'gender', 'bio'] as const

/**
 * The retired feed setting. The column is still on `profiles` and old clients (the app-store builds
 * bundle the web app) still send it, so the API keeps accepting these values; nothing reads them.
 */
export const FEED_VISIBILITY_LEVELS = ['none', 'basic', 'full'] as const

export type FeedVisibility = (typeof FEED_VISIBILITY_LEVELS)[number]

/**
 * A feed entry is an invitation to open the profile, not a copy of it — so the excerpt stops well short
 * of the whole bio.
 */
export const MAX_FEED_BIO_CHARS = 400

/** Items per feed response. Enough for a bridge polling daily to never miss anyone. */
export const DEFAULT_FEED_LIMIT = 50
export const MAX_FEED_LIMIT = 200

/**
 * One syndicated profile. Every field beyond `username`/`name`/`createdTime` is optional because the
 * *server* drops what the member does not show to everyone — the renderer never has to know who sees
 * what, and no endpoint can leak a hidden field by forgetting a check.
 *
 * `createdTime` is an ISO string rather than a `Date`: it crosses the wire as JSON and is only ever
 * reformatted (to RFC-822) on the way into the feed.
 */
export type FeedItem = {
  username: string
  name: string
  createdTime: string
  headline?: string
  /** "Rome, Italy", or just the country when no city is set. */
  location?: string
  /**
   * Keywords are self-chosen labels rather than anything the profile reveals about a
   * person, and they are what makes an entry findable by someone scanning a timeline — the fediverse
   * reads them the way it reads hashtags.
   */
  keywords?: string[]
  gender?: string
  /** Plain text, truncated to {@link MAX_FEED_BIO_CHARS} at a word boundary. */
  bioExcerpt?: string
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
