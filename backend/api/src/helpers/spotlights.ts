import {type JSONContent} from '@tiptap/core'
import {AdminSpotlight, PublicSpotlight, SpotlightStatus} from 'common/profiles/spotlights'

/** The columns as they come back from `profile_spotlights`. */
export type SpotlightQueryRow = {
  id: string
  user_id: string | null
  name: string
  username: string | null
  age: number | null
  city: string | null
  country: string | null
  photo_url: string | null
  headline: string | null
  quote: string
  quote_context: string | null
  tags: string[] | null
  status: SpotlightStatus
  featured_rank: number | null
  admin_note: string | null
  captured_time: string
  created_time: string
  updated_time: string
}

/** The same row joined to `profiles`, for the admin view where current consent matters. */
export type SpotlightAdminQueryRow = SpotlightQueryRow & {consents: boolean | null}

export const SPOTLIGHT_COLUMNS = `id, user_id, name, username, age, city, country, photo_url,
                                  headline, quote, quote_context, tags, status, featured_rank,
                                  admin_note, captured_time, created_time, updated_time`

/**
 * The same list qualified with `s.`, for the two reads that join `profile_spotlights` to `profiles`.
 * Both tables have `user_id`, `name`, `city`, `country`, `headline` and `age`, so an unqualified list
 * is ambiguous in exactly the queries that matter most.
 */
export const SPOTLIGHT_COLUMNS_PREFIXED = SPOTLIGHT_COLUMNS.split(',')
  .map((c) => `s.${c.trim()}`)
  .join(', ')

/**
 * Strip a row down to what anyone may see.
 *
 * The username is dropped once `user_id` is null: the account is gone, so the handle either 404s or
 * now belongs to somebody else, and a spotlight linking a stranger's profile to a quote they never
 * wrote is the worst failure this feature has available to it.
 */
export const toPublicSpotlight = (row: SpotlightQueryRow): PublicSpotlight => ({
  id: Number(row.id),
  name: row.name,
  username: row.user_id === null ? null : row.username,
  age: row.age,
  city: row.city,
  country: row.country,
  photoUrl: row.photo_url,
  headline: row.headline,
  quote: row.quote,
  quoteContext: row.quote_context,
  tags: row.tags ?? [],
  capturedTime: new Date(row.captured_time).toISOString(),
})

export const toAdminSpotlight = (row: SpotlightAdminQueryRow): AdminSpotlight => ({
  ...toPublicSpotlight(row),
  status: row.status,
  featuredRank: row.featured_rank,
  adminNote: row.admin_note,
  createdTime: new Date(row.created_time).toISOString(),
  updatedTime: new Date(row.updated_time).toISOString(),
  userId: row.user_id,
  // Null when the account is gone; treated as "no consent on record", which is the safe reading.
  consents: row.consents === true,
})

/**
 * The live profile fields a snapshot is taken from.
 *
 * `pinned_url` first, `avatar_url` second: the pinned photo is the one the member chose to lead their
 * own profile with, and the avatar is a thumbnail that may well be a crop of it.
 */
export type SpotlightSourceRow = {
  user_id: string
  name: string
  username: string
  age: number | null
  city: string | null
  country: string | null
  photo_url: string | null
  headline: string | null
  /** The TipTap document. `bio_text` is its flattened form, and reads like one when rendered. */
  bio: JSONContent | string | null
  spotlight_consent: boolean
  social_media_consent: boolean
  visibility: string
}

export const SPOTLIGHT_SOURCE_SELECT = `select p.user_id,
                                               u.name,
                                               u.username,
                                               p.age,
                                               p.city,
                                               p.country,
                                               coalesce(p.pinned_url, u.avatar_url) as photo_url,
                                               p.headline,
                                               p.bio,
                                               p.spotlight_consent,
                                               p.social_media_consent,
                                               p.visibility
                                        from profiles p
                                                 join users u on u.id = p.user_id`
