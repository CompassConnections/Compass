import {APIHandler} from 'api/helpers/endpoint'
import {TESTIMONIAL_COLUMNS, TestimonialQueryRow, toModTestimonial} from 'api/helpers/testimonials'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Every testimonial in every state, for the moderation strip on `/testimonials` and the queue at
 * `/admin/testimonials`.
 *
 * Pending first regardless of the requested ordering: it is the only bucket that represents work
 * owed, and a moderator opening the page should not have to scroll past published ones to find it.
 */
export const getTestimonialsMod: APIHandler<'get-testimonials-mod'> = async (props, auth) => {
  await throwErrorIfNotMod(auth.uid)

  const pg = createSupabaseDirectClient()

  const rows = await pg.any<TestimonialQueryRow>(
    `select ${TESTIMONIAL_COLUMNS}
     from testimonials
     where $(status) is null or status = $(status)
     order by (status = 'pending') desc, featured_rank desc nulls last, created_time desc`,
    {status: props.status ?? null},
  )

  return {testimonials: rows.map(toModTestimonial)}
}
