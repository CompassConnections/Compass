import {sendDiscordMessage} from 'common/discord/core'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {
  ModTestimonial,
  PublicTestimonial,
  TestimonialSource,
  TestimonialStatus,
} from 'common/testimonials/testimonials'
import {SupabaseDirectClient} from 'shared/supabase/init'

/** The columns as they come back from `testimonials`. */
export type TestimonialQueryRow = {
  id: string
  author_id: string | null
  author_name: string
  author_username: string | null
  author_avatar_url: string | null
  body: string
  headline: string | null
  rating: number | null
  show_author: boolean
  source: TestimonialSource
  status: TestimonialStatus
  moderator_note: string | null
  moderated_time: string | null
  featured_rank: number | null
  created_time: string
}

/**
 * Strip a row down to what anyone may see.
 *
 * `show_author = false` drops the name, avatar and username entirely rather than blanking them on the
 * client — an anonymous testimonial whose author is one devtools panel away is not anonymous.
 *
 * The username is also dropped once `author_id` is null: the account is gone, so the handle either
 * 404s or, worse, now belongs to somebody else.
 */
export const toPublicTestimonial = (row: TestimonialQueryRow): PublicTestimonial => ({
  id: Number(row.id),
  body: row.body,
  headline: row.headline,
  rating: row.rating,
  source: row.source,
  createdTime: new Date(row.created_time).toISOString(),
  author: row.show_author
    ? {
        name: row.author_name,
        username: row.author_id === null ? null : row.author_username,
        avatarUrl: row.author_avatar_url,
      }
    : null,
})

/** The same row with everything a moderator needs, including the author of an anonymous one. */
export const toModTestimonial = (row: TestimonialQueryRow): ModTestimonial => ({
  ...toPublicTestimonial(row),
  status: row.status,
  showAuthor: row.show_author,
  featuredRank: row.featured_rank,
  moderatorNote: row.moderator_note,
  moderatedTime: row.moderated_time === null ? null : new Date(row.moderated_time).toISOString(),
  authorSnapshot: {
    name: row.author_name,
    username: row.author_id === null ? null : row.author_username,
    avatarUrl: row.author_avatar_url,
  },
  authorId: row.author_id,
})

export const TESTIMONIAL_COLUMNS = `id, author_id, author_name, author_username, author_avatar_url,
                                    body, headline, rating, show_author, source, status,
                                    moderator_note, moderated_time, featured_rank, created_time`

export type TestimonialInsert = {
  authorId: string
  authorName: string
  authorUsername: string | null
  authorAvatarUrl: string | null
  body: string
  headline?: string | null
  rating?: number | null
  showAuthor?: boolean
  source: TestimonialSource
}

/**
 * Write one testimonial in the `pending` state.
 *
 * Shared by the page and by the deletion survey, which needs the insert to happen on the same
 * connection as the delete that follows it.
 *
 * A member who already has a live testimonial (pending, approved or taken down) hits the partial
 * unique index; that is reported as a conflict rather than silently overwriting what a moderator may
 * already have read and approved. A previously rejected one is outside the index, so a second attempt
 * after a rejection goes through.
 */
export const insertTestimonial = async (
  pg: SupabaseDirectClient,
  t: TestimonialInsert,
): Promise<TestimonialQueryRow | null> =>
  pg.oneOrNone<TestimonialQueryRow>(
    `insert into testimonials (author_id, author_name, author_username, author_avatar_url,
                               body, headline, rating, show_author, source)
     values ($(authorId), $(authorName), $(authorUsername), $(authorAvatarUrl),
             $(body), $(headline), $(rating), $(showAuthor), $(source))
     on conflict do nothing
     returning ${TESTIMONIAL_COLUMNS}`,
    {
      ...t,
      headline: t.headline?.trim() || null,
      rating: t.rating ?? null,
      showAuthor: t.showAuthor ?? true,
    },
  )

/**
 * Ping the contact channel so a new testimonial gets reviewed instead of sitting in `pending`.
 *
 * Always call this from a `continue` continuation or a try/catch — a Discord outage must never be the
 * reason a member's testimonial fails to save, and in the deletion case it must never be the reason an
 * account deletion fails.
 */
export const notifyTestimonialSubmitted = async (
  row: TestimonialQueryRow,
  opts: {fromDeletion: boolean},
) => {
  const who = row.show_author ? row.author_name : `${row.author_name} (posting anonymously)`
  const stars = row.rating === null ? '' : ` ${'★'.repeat(row.rating)}${'☆'.repeat(5 - row.rating)}`
  const context = opts.fromDeletion
    ? '💛 **Parting testimonial** — they found someone on Compass and are deleting their account'
    : '📝 **New testimonial**'

  const message = [
    `${context}${stars}`,
    `From: ${who}`,
    row.headline ? `**${row.headline}**` : null,
    // Quoted so a testimonial containing markdown can't restyle the whole message.
    `> ${row.body.replace(/\n+/g, '\n> ')}`,
    `Review it at ${DEPLOYED_WEB_URL}/testimonials — approve or reject inline, or use ${DEPLOYED_WEB_URL}/admin/testimonials`,
  ]
    .filter(Boolean)
    .join('\n')

  await sendDiscordMessage(message, 'contact')
}
