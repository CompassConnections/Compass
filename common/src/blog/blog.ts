/**
 * The Compass blog — long-form posts written by an admin, listed at `/blog`, read at `/blog/<slug>`.
 *
 * Sits deliberately apart from the other two "published content" features:
 *
 *   - a **testimonial** is written by a member about Compass, and moderated by us;
 *   - a **spotlight** is written by us about a member, from their words, with their consent;
 *   - a **blog post** is written by us about anything, and has no member in it at all.
 *
 * That last difference is what removes the consent gate and the snapshot rule, and it is also what
 * adds the two things neither of the others has: a URL that outlives the post's first day, and a
 * one-shot broadcast to every member. Those are the two irreversible parts, so they are the two the
 * validation below is actually about.
 *
 * The constants here are mirrored by CHECK constraints in
 * `backend/supabase/migrations/20260822_add_blog_posts.sql`; changing one without the other turns a
 * friendly validation message into a 500.
 */

import {type JSONContent} from '@tiptap/core'

/**
 * `draft` is written and unreachable. `published` is public. `archived` was published and was pulled
 * — kept distinct from deleting the row so a takedown is reversible, and so the slug stays claimed
 * rather than being reused by a different post under a URL people have already shared.
 */
export const BLOG_POST_STATUSES = ['draft', 'published', 'archived'] as const

export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number]

export const BLOG_POST_STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Taken down',
}

export const MIN_BLOG_SLUG_LENGTH = 3
export const MAX_BLOG_SLUG_LENGTH = 120
export const MIN_BLOG_TITLE_LENGTH = 3
export const MAX_BLOG_TITLE_LENGTH = 200
export const MAX_BLOG_EXCERPT_LENGTH = 400

/**
 * The body cap. Generous, because the point of the feature is long-form — but a rich-text document
 * is stored as one JSONB value and read whole, so "no limit at all" means one pasted book can make
 * every `/blog` read slow.
 */
export const MAX_BLOG_CONTENT_LENGTH = 100_000

/** How many posts `/blog` asks for in one page. */
export const BLOG_POSTS_PER_PAGE = 20

/**
 * The notification body an admin types when publishing. Short on purpose: it renders inside a
 * notification row that is already line-clamped, and the post itself is one tap away.
 */
export const MAX_BLOG_NOTIFICATION_LENGTH = 500

/** Same wire convention as testimonials and spotlights: ISO-8601 strings, not revived `Date`s. */
export type IsoTimestamp = string

/**
 * The byline.
 *
 * Read live from `users` rather than snapshotted onto the post — the opposite choice from
 * `profile_spotlights`, and for the opposite reason: a spotlight freezes its subject's details
 * because the subject must not be able to rewrite the front page, whereas a blog author renaming
 * themselves and having their own byline follow is just correct. Null once the account is gone; the
 * post then renders under the site name rather than under a handle that may now belong to somebody
 * else.
 */
export type BlogAuthor = {
  name: string
  username: string
  avatarUrl: string | null
}

/** One post as it appears in the `/blog` list — everything but the body. */
export type BlogPostSummary = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  author: BlogAuthor | null
  publishedTime: IsoTimestamp | null
  /** Whole minutes, floored at 1. Derived from the flattened body — see `getReadingMinutes`. */
  readingMinutes: number
}

/** One post as read at `/blog/<slug>`. */
export type BlogPost = BlogPostSummary & {
  content: JSONContent | string
}

/** The same post with the editorial state an admin needs. Never served publicly. */
export type AdminBlogPost = BlogPost & {
  status: BlogPostStatus
  /** Null until the first publish, and never moved by a later edit. */
  publishedTime: IsoTimestamp | null
  /** Set the moment the broadcast goes out. Non-null means "everyone has already been told". */
  notifiedTime: IsoTimestamp | null
  createdTime: IsoTimestamp
  updatedTime: IsoTimestamp
}

/**
 * Average adult reading speed for prose, rounded down to something defensible. The estimate exists to
 * tell a reader whether this is a coffee-break piece or a sit-down one, so being a minute out is
 * fine and being precise is not worth a dependency.
 */
const WORDS_PER_MINUTE = 220

export const getReadingMinutes = (contentText: string) =>
  Math.max(1, Math.round(contentText.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE))

/**
 * The one shape a slug may take: lowercase alphanumerics in dash-separated runs. Mirrors the CHECK
 * constraint on `blog_posts.slug`.
 *
 * Strict rather than forgiving because this is a path segment. A slug with a space, a slash or an
 * accent in it is not a slug that looks untidy — it is a route that does not resolve, or resolves
 * only after percent-encoding that then appears in every link anyone shares.
 */
export const BLOG_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Best-effort title → slug, used to prefill the slug box in the admin page.
 *
 * A suggestion, never a silent substitution: the admin sees the result in an editable field before
 * anything is created, because the slug is the half of a post that cannot be quietly fixed later.
 */
export const slugifyBlogTitle = (title: string) =>
  title
    .normalize('NFKD')
    // Strip the combining marks NFKD just separated out, so "réunion" becomes "reunion" rather than
    // losing the vowel entirely.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BLOG_SLUG_LENGTH)
    // A trim after slicing, in case the cut landed mid-dash.
    .replace(/-+$/g, '')

export type BlogPostDraft = {
  slug: string
  title: string
  excerpt?: string | null
}

/** Shared client/server validation. Returns null when the draft is submittable. */
export const getBlogPostDraftError = (
  draft: BlogPostDraft,
):
  | 'slug_invalid'
  | 'slug_too_short'
  | 'slug_too_long'
  | 'title_too_short'
  | 'title_too_long'
  | 'excerpt_too_long'
  | null => {
  const slug = draft.slug.trim()
  const title = draft.title.trim()
  if (slug.length < MIN_BLOG_SLUG_LENGTH) return 'slug_too_short'
  if (slug.length > MAX_BLOG_SLUG_LENGTH) return 'slug_too_long'
  if (!BLOG_SLUG_REGEX.test(slug)) return 'slug_invalid'
  if (title.length < MIN_BLOG_TITLE_LENGTH) return 'title_too_short'
  if (title.length > MAX_BLOG_TITLE_LENGTH) return 'title_too_long'
  if ((draft.excerpt ?? '').length > MAX_BLOG_EXCERPT_LENGTH) return 'excerpt_too_long'
  return null
}

/** "22 August 2026", or null before the post has been published. */
export const formatBlogDate = (time: IsoTimestamp | null, locale = 'en-GB') =>
  time === null
    ? null
    : new Date(time).toLocaleDateString(locale, {day: 'numeric', month: 'long', year: 'numeric'})
