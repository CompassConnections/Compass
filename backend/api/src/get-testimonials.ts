import {APIHandler} from 'api/helpers/endpoint'
import {
  TESTIMONIAL_COLUMNS,
  TestimonialQueryRow,
  toPublicTestimonial,
} from 'api/helpers/testimonials'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The public wall. Approved rows only — `pending`, `rejected` and `hidden` never leave the server.
 *
 * Curated first (`featured_rank` descending), then newest. Nulls sort last so the default ordering,
 * before anyone has featured anything, is plain reverse-chronological.
 */
export const getTestimonials: APIHandler<'get-testimonials'> = async () => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.any<TestimonialQueryRow>(
    `select ${TESTIMONIAL_COLUMNS}
     from testimonials
     where status = 'approved'
     order by featured_rank desc nulls last, created_time desc`,
  )

  return {testimonials: rows.map(toPublicTestimonial)}
}
