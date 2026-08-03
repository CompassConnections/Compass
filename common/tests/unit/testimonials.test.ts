import {
  getTestimonialDraftError,
  isPubliclyVisible,
  MAX_TESTIMONIAL_BODY_LENGTH,
  MAX_TESTIMONIAL_HEADLINE_LENGTH,
  MIN_TESTIMONIAL_BODY_LENGTH,
  TESTIMONIAL_STATUSES,
} from 'common/testimonials/testimonials'

const bodyOfLength = (n: number) => 'a'.repeat(n)

describe('getTestimonialDraftError', () => {
  it('rejects a body below the minimum', () => {
    expect(getTestimonialDraftError({body: 'Great app!'})).toBe('too_short')
  })

  it('accepts a body exactly at the minimum', () => {
    expect(getTestimonialDraftError({body: bodyOfLength(MIN_TESTIMONIAL_BODY_LENGTH)})).toBeNull()
  })

  it('measures the trimmed body, so whitespace cannot pad it to the minimum', () => {
    const almost = bodyOfLength(MIN_TESTIMONIAL_BODY_LENGTH - 1)
    expect(getTestimonialDraftError({body: `   ${almost}   `})).toBe('too_short')
  })

  it('rejects a body over the maximum', () => {
    expect(getTestimonialDraftError({body: bodyOfLength(MAX_TESTIMONIAL_BODY_LENGTH + 1)})).toBe(
      'too_long',
    )
  })

  it('rejects an over-long headline even when the body is fine', () => {
    expect(
      getTestimonialDraftError({
        body: bodyOfLength(MIN_TESTIMONIAL_BODY_LENGTH),
        headline: 'h'.repeat(MAX_TESTIMONIAL_HEADLINE_LENGTH + 1),
      }),
    ).toBe('headline_too_long')
  })

  it('treats a missing headline as valid', () => {
    const body = bodyOfLength(MIN_TESTIMONIAL_BODY_LENGTH)
    expect(getTestimonialDraftError({body, headline: null})).toBeNull()
    expect(getTestimonialDraftError({body})).toBeNull()
  })
})

describe('isPubliclyVisible', () => {
  it('publishes approved and nothing else', () => {
    const visible = TESTIMONIAL_STATUSES.filter(isPubliclyVisible)
    expect(visible).toEqual(['approved'])
  })
})
