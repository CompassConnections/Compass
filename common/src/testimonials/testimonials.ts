/**
 * The testimonials wall — what members say about Compass, on a public page at `/testimonials`.
 *
 * Every submission is moderated before it is visible. The constants here are mirrored by CHECK
 * constraints in `backend/supabase/migrations/20260803_add_testimonials.sql`; changing one without the
 * other turns a friendly client-side validation message into a 500.
 */

/**
 * `pending` is where everything starts. `rejected` is a moderator saying this never goes up; `hidden`
 * is a moderator taking down something that was up. They are distinct because the second one is the
 * state a member might ask about, and "we approved it then pulled it" is a different conversation from
 * "we never published it".
 */
export const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected', 'hidden'] as const

export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number]

export const TESTIMONIAL_STATUS_LABELS: Record<TestimonialStatus, string> = {
  pending: 'Pending review',
  approved: 'Published',
  rejected: 'Rejected',
  hidden: 'Taken down',
}

/** Where a testimonial was written. `deletion_survey` is the one that is also an outcome. */
export const TESTIMONIAL_SOURCES = ['member', 'deletion_survey'] as const

export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[number]

/**
 * Short enough that a sentence and a half clears it, long enough to exclude "love it!". The floor is
 * the only quality gate that can be applied before a human reads the thing.
 */
export const MIN_TESTIMONIAL_BODY_LENGTH = 40
export const MAX_TESTIMONIAL_BODY_LENGTH = 1500
export const MAX_TESTIMONIAL_HEADLINE_LENGTH = 100
export const MAX_TESTIMONIAL_AUTHOR_NAME_LENGTH = 100
export const MAX_MODERATOR_NOTE_LENGTH = 500

/**
 * Timestamps cross the wire as ISO-8601 strings rather than `Date`.
 *
 * The endpoint declares `returns` as a cast type rather than a Zod schema (the house style for
 * read-heavy endpoints), so nothing revives a `Date` on the client and typing the field as one would
 * be a lie the compiler happily accepts. The wall renders month-and-year, so a string is also all it
 * needs.
 */
export type IsoTimestamp = string

/** The author as the public wall shows them. Null when the testimonial was published anonymously. */
export type TestimonialAuthor = {
  name: string
  /** Present only while the account still exists — it is what makes the name a link. */
  username: string | null
  avatarUrl: string | null
}

/** One approved testimonial, as served to anyone. Never carries moderation state or a user id. */
export type PublicTestimonial = {
  id: number
  body: string
  headline: string | null
  rating: number | null
  source: TestimonialSource
  createdTime: IsoTimestamp
  /** Null means "published anonymously" — not "the account was deleted". */
  author: TestimonialAuthor | null
}

/** The same row with everything a moderator needs, including who wrote an anonymous one. */
export type ModTestimonial = PublicTestimonial & {
  status: TestimonialStatus
  showAuthor: boolean
  featuredRank: number | null
  moderatorNote: string | null
  moderatedTime: IsoTimestamp | null
  /** Always populated, even when `author` is null because the member chose anonymity. */
  authorSnapshot: TestimonialAuthor
  /** Null once the account has been deleted — the testimonial outlives it by design. */
  authorId: string | null
}

/** Statuses whose rows are on the public wall. */
export const isPubliclyVisible = (status: TestimonialStatus) => status === 'approved'

export type TestimonialDraft = {
  body: string
  headline?: string | null
  rating?: number | null
  showAuthor?: boolean
}

/**
 * Client-side validation, shared so the page, the deletion survey and the API all agree on what
 * counts as writable. Returns null when the draft is submittable.
 */
export const getTestimonialDraftError = (
  draft: TestimonialDraft,
): 'too_short' | 'too_long' | 'headline_too_long' | null => {
  const body = draft.body.trim()
  if (body.length < MIN_TESTIMONIAL_BODY_LENGTH) return 'too_short'
  if (body.length > MAX_TESTIMONIAL_BODY_LENGTH) return 'too_long'
  if ((draft.headline ?? '').length > MAX_TESTIMONIAL_HEADLINE_LENGTH) return 'headline_too_long'
  return null
}
