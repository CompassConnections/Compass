import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Approve, reject, take down or feature one testimonial.
 *
 * Every field is independently optional: the wall's inline approve button sends only a status, and the
 * queue's rank box sends only a rank. `undefined` leaves a column alone, `null` clears it — otherwise
 * approving something would silently wipe the note explaining why it was held back.
 */
export const updateTestimonialStatus: APIHandler<'update-testimonial-status'> = async (
  props,
  auth,
) => {
  await throwErrorIfNotMod(auth.uid)

  const {id, status, featuredRank, moderatorNote} = props

  const pg = createSupabaseDirectClient()

  const updated = await pg.oneOrNone<{id: string}>(
    `update testimonials
     set status         = coalesce($(status), status),
         featured_rank  = case when $(rankProvided) then $(featuredRank) else featured_rank end,
         moderator_note = case when $(noteProvided) then $(moderatorNote) else moderator_note end,
         -- Only a status change is a moderation decision. Re-ordering the wall is housekeeping, and
         -- stamping it would overwrite the record of who actually approved the thing.
         moderator_id   = case when $(status) is null then moderator_id else $(moderatorId) end,
         moderated_time = case when $(status) is null then moderated_time else now() end,
         updated_time   = now()
     where id = $(id)
     returning id`,
    {
      id,
      status: status ?? null,
      featuredRank: featuredRank ?? null,
      rankProvided: featuredRank !== undefined,
      moderatorNote: moderatorNote?.trim() || null,
      noteProvided: moderatorNote !== undefined,
      moderatorId: auth.uid,
    },
  )

  if (!updated) throw APIErrors.notFound('Testimonial not found')
}
