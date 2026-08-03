import {ArrowRightIcon} from '@heroicons/react/24/outline'
import Link from 'next/link'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'

import {Col} from '../layout/col'
import {Row} from '../layout/row'
import {TestimonialCard} from './testimonial-card'

/**
 * A few approved testimonials, for pages that are making an argument and want evidence next to it.
 *
 * Renders nothing at all while loading or when the wall is empty — a marketing page with a "what
 * members say" heading over three skeletons, or over nothing, is worse than one without the section.
 * Prefers the ones written on the way out after finding someone, since those are the only ones that
 * are also an outcome.
 */
/**
 * Whether the teaser would render anything.
 *
 * Exists so a caller can drop its own heading and section spacing too — a component that returns null
 * still leaves an empty `<Section>` and a dangling label behind it. `useAPIGetter` dedups by key, so
 * calling this alongside the teaser costs one request, not two.
 */
export const useHasTestimonials = () => {
  const {data} = useAPIGetter('get-testimonials', {})
  return (data?.testimonials.length ?? 0) > 0
}

export function TestimonialsTeaser({count = 3}: {count?: number}) {
  const t = useT()
  const {data} = useAPIGetter('get-testimonials', {})

  const all = data?.testimonials ?? []
  if (!all.length) return null

  const foundSomeone = all.filter((row) => row.source === 'deletion_survey')
  const rest = all.filter((row) => row.source !== 'deletion_survey')
  const shown = [...foundSomeone, ...rest].slice(0, count)

  return (
    <Col className="gap-5">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>

      <Link
        href="/testimonials"
        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
      >
        <Row className="items-center gap-1.5">
          {t('testimonials.teaser.read_all', 'Read all {count} stories', {count: all.length})}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Row>
      </Link>
    </Col>
  )
}
