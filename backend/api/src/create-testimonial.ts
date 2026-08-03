import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {insertTestimonial, notifyTestimonialSubmitted} from 'api/helpers/testimonials'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

/**
 * Submit a testimonial from `/testimonials`. It lands in `pending` and is invisible until a moderator
 * approves it, so nothing a member writes here is ever publicly reachable unreviewed.
 */
export const createTestimonial: APIHandler<'create-testimonial'> = async (props, auth) => {
  const user = await getUser(auth.uid)
  if (!user) throw APIErrors.unauthorized('Your account was not found')

  // Someone who cannot post anywhere else on the site should not be able to post on the front page of
  // it, even into a queue a moderator then has to clear out.
  if (user.isBannedFromPosting) throw APIErrors.forbidden('Your account cannot post')

  const pg = createSupabaseDirectClient()

  const row = await insertTestimonial(pg, {
    authorId: user.id,
    authorName: user.name,
    authorUsername: user.username,
    authorAvatarUrl: user.avatarUrl ?? null,
    body: props.body,
    headline: props.headline,
    rating: props.rating,
    showAuthor: props.showAuthor,
    source: 'member',
  })

  // `on conflict do nothing` returning nothing means the partial unique index fired: they already have
  // one waiting, live, or taken down.
  if (!row) {
    throw APIErrors.badRequest(
      'You have already written a testimonial. Ask a moderator if you would like to change it.',
    )
  }

  return {
    result: {status: 'pending' as const},
    continue: async () => {
      try {
        await notifyTestimonialSubmitted(row, {fromDeletion: false})
      } catch (e) {
        console.error('Failed to send discord testimonial notification', e)
      }
    },
  }
}
