/**
 * Member spotlights — a few real members on the logged-out home page, beside the distributions in
 * "Who's here".
 *
 * Distinct from testimonials on purpose, and the difference is not cosmetic:
 *
 *   - a **testimonial** is something a member wrote *about Compass*, submitted by them, moderated by
 *     us. The member is the author.
 *   - a **spotlight** is something *we* wrote *about a member*, assembled by an admin out of that
 *     member's own words, with the member's standing consent. The admin is the editor.
 *
 * That is why this has its own table and its own endpoints rather than a `kind` column on
 * `testimonials`: the two have opposite authorship, opposite lifecycles, and opposite failure modes.
 *
 * The snapshot rule is the load-bearing part. A spotlight never reads the live profile. If it did,
 * anyone who had ever been spotlighted could rewrite the front page of Compass at will. Everything the
 * card renders is frozen at capture time and only changes when an admin re-captures it. See
 * `backend/supabase/migrations/20260812_add_profile_spotlights.sql`.
 *
 * The constants here are mirrored by CHECK constraints in that migration; changing one without the
 * other turns a friendly validation message into a 500.
 */

import {type JSONContent} from '@tiptap/core'

/**
 * `draft` is prepared and invisible. `live` is on the home page. `retired` was live and was pulled —
 * kept distinct from deleting the row so a takedown is reversible and leaves a record of itself.
 */
export const SPOTLIGHT_STATUSES = ['draft', 'live', 'retired'] as const

export type SpotlightStatus = (typeof SPOTLIGHT_STATUSES)[number]

export const SPOTLIGHT_STATUS_LABELS: Record<SpotlightStatus, string> = {
  draft: 'Draft',
  live: 'On the home page',
  retired: 'Taken down',
}

/**
 * The floor exists because a pull quote shorter than this is a fragment, and a fragment reads as
 * marketing rather than as somebody talking. The ceiling is roughly where a card stops being scannable
 * and starts being an essay — the link to the full profile is right there.
 */
export const MIN_SPOTLIGHT_QUOTE_LENGTH = 40
export const MAX_SPOTLIGHT_QUOTE_LENGTH = 400
export const MAX_SPOTLIGHT_QUOTE_CONTEXT_LENGTH = 80
export const MAX_SPOTLIGHT_HEADLINE_LENGTH = 500
export const MAX_SPOTLIGHT_ADMIN_NOTE_LENGTH = 500

/** Chips under the quote. Few and short, or the card stops being a person and becomes a CV. */
export const MAX_SPOTLIGHT_TAGS = 5
export const MAX_SPOTLIGHT_TAG_LENGTH = 40

/** How many the home page asks for. Six fills the rail without turning it into a directory. */
export const HOME_SPOTLIGHT_LIMIT = 6

/** Same wire convention as testimonials: ISO-8601 strings, not revived `Date`s. */
export type IsoTimestamp = string

/**
 * One spotlight as anyone may see it.
 *
 * Every field is snapshot data. `username` is the single exception in spirit — it is snapshot too, but
 * it is the one field whose *purpose* is to point at the live profile, which is what makes the card
 * checkable rather than a claim. It is nulled when the account is gone, so a card never links to a
 * handle that now belongs to somebody else.
 */
export type PublicSpotlight = {
  id: number
  name: string
  username: string | null
  age: number | null
  city: string | null
  country: string | null
  photoUrl: string | null
  headline: string | null
  quote: string
  quoteContext: string | null
  tags: string[]
  capturedTime: IsoTimestamp
}

/** The same row with the editorial state an admin needs. Never served publicly. */
export type AdminSpotlight = PublicSpotlight & {
  status: SpotlightStatus
  featuredRank: number | null
  adminNote: string | null
  createdTime: IsoTimestamp
  updatedTime: IsoTimestamp
  /** Null once the account has been deleted — the snapshot outlives it, the link does not. */
  userId: string | null
  /**
   * Whether the member still consents. False here with `status: 'live'` is not a broken state: the
   * public endpoint already hides the card. It is the admin's cue to retire it properly.
   */
  consents: boolean
}

/**
 * A consenting member who has no snapshot yet, as offered to the admin picker — enough to decide
 * whether they are worth spotlighting without opening every profile in a new tab.
 */
export type SpotlightCandidate = {
  userId: string
  name: string
  username: string
  age: number | null
  city: string | null
  country: string | null
  photoUrl: string | null
  headline: string | null
  /**
   * The bio as stored — the TipTap JSON document, not the flattened `bio_text`.
   *
   * Rendered rather than excerpted, because picking a pull quote is a reading job: `bio_text` runs
   * headings, list items and paragraphs together into one wall, so the sentence that would have made a
   * good card is the hardest thing in it to find. Sent whole, not sliced — the admin needs the passage
   * wherever it happens to be, and the good line is rarely the opening one.
   */
  bio: JSONContent | string | null
  /**
   * Whether they also said yes to being featured on Compass's own social accounts — the extra,
   * nested consent behind the profile-scroll clips in `media-creator`. Shown here because it is the
   * one thing about a candidate that cannot be inferred by reading their profile, and filming
   * someone who only agreed to the home page is not a mistake that can be walked back.
   */
  socialConsent: boolean
}

export type SpotlightDraft = {
  quote: string
  quoteContext?: string | null
  tags?: string[]
}

/** Shared client/server validation. Returns null when the draft is submittable. */
export const getSpotlightDraftError = (
  draft: SpotlightDraft,
): 'quote_too_short' | 'quote_too_long' | 'context_too_long' | 'too_many_tags' | null => {
  const quote = draft.quote.trim()
  if (quote.length < MIN_SPOTLIGHT_QUOTE_LENGTH) return 'quote_too_short'
  if (quote.length > MAX_SPOTLIGHT_QUOTE_LENGTH) return 'quote_too_long'
  if ((draft.quoteContext ?? '').length > MAX_SPOTLIGHT_QUOTE_CONTEXT_LENGTH)
    return 'context_too_long'
  if ((draft.tags ?? []).length > MAX_SPOTLIGHT_TAGS) return 'too_many_tags'
  return null
}

/** "Brussels, Belgium" / "Brussels" / "Belgium" / null, without a stray comma in any of them. */
export const formatSpotlightLocation = (s: {city: string | null; country: string | null}) =>
  [s.city, s.country].filter(Boolean).join(', ') || null
