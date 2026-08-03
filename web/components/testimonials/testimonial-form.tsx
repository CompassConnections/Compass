import clsx from 'clsx'
import {
  getTestimonialDraftError,
  MAX_TESTIMONIAL_BODY_LENGTH,
  MAX_TESTIMONIAL_HEADLINE_LENGTH,
  MIN_TESTIMONIAL_BODY_LENGTH,
} from 'common/testimonials/testimonials'
import {useT} from 'web/lib/locale'

import {Col} from '../layout/col'
import {Checkbox} from '../widgets/checkbox'
import {ExpandingInput} from '../widgets/expanding-input'
import {Input} from '../widgets/input'
import {RatingStarsInput} from './rating-stars'

/** The composer's working state. Kept as plain strings so an empty box is `''` rather than `null`. */
export type TestimonialDraftState = {
  body: string
  headline: string
  rating: number | null
  showAuthor: boolean
}

export const EMPTY_TESTIMONIAL_DRAFT: TestimonialDraftState = {
  body: '',
  headline: '',
  rating: null,
  // Defaulting to shown, because a wall of anonymous quotes is worth much less than a wall of named
  // ones and most people will not go looking for the toggle either way.
  showAuthor: true,
}

/** Whether the draft is complete enough to send. */
export const isTestimonialDraftValid = (draft: TestimonialDraftState) =>
  getTestimonialDraftError({
    body: draft.body,
    headline: draft.headline,
    rating: draft.rating,
    showAuthor: draft.showAuthor,
  }) === null

/** Shape the API expects, from the composer's working state. */
export const toTestimonialProps = (draft: TestimonialDraftState) => ({
  body: draft.body.trim(),
  headline: draft.headline.trim() || null,
  rating: draft.rating,
  showAuthor: draft.showAuthor,
})

/**
 * The testimonial composer, shared by the wall's "write one" modal and the account-deletion survey.
 *
 * It is a controlled component with no submit button of its own: the deletion survey needs the draft
 * to sit inside a form it already owns and to gate its own submit on it, and a component that owned
 * its own submission could not do that.
 */
export function TestimonialForm({
  draft,
  setDraft,
  idPrefix = 'testimonial',
  autoFocus,
  className,
}: {
  draft: TestimonialDraftState
  setDraft: (draft: TestimonialDraftState) => void
  /** Distinguishes the label/input pairs when two composers exist on one page. */
  idPrefix?: string
  autoFocus?: boolean
  className?: string
}) {
  const t = useT()
  const set = (patch: Partial<TestimonialDraftState>) => setDraft({...draft, ...patch})

  return (
    <Col className={clsx('gap-4', className)}>
      <Col className="gap-1.5">
        <label className="text-ink-700 text-sm font-medium">
          {t('testimonials.form.rating_label', 'How was your experience?')}{' '}
          <span className="text-ink-400 font-normal">
            {t('testimonials.form.optional', '(optional)')}
          </span>
        </label>
        <RatingStarsInput
          value={draft.rating}
          onChange={(rating) => set({rating})}
          label={t('testimonials.form.rating_label', 'How was your experience?')}
        />
      </Col>

      <Col className="gap-1.5">
        <label htmlFor={`${idPrefix}-headline`} className="text-ink-700 text-sm font-medium">
          {t('testimonials.form.headline_label', 'Sum it up in a few words')}{' '}
          <span className="text-ink-400 font-normal">
            {t('testimonials.form.optional', '(optional)')}
          </span>
        </label>
        <Input
          id={`${idPrefix}-headline`}
          maxLength={MAX_TESTIMONIAL_HEADLINE_LENGTH}
          placeholder={t(
            'testimonials.form.headline_placeholder',
            'I met someone I would never have found otherwise',
          )}
          value={draft.headline}
          onChange={(e) => set({headline: e.target.value})}
        />
      </Col>

      <Col className="gap-1.5">
        {/* The minimum lives in the label rather than in a counter under the box: it is a rule about
            what to write, so it belongs where you read before typing, not where you look after. */}
        <label htmlFor={`${idPrefix}-body`} className="text-ink-700 text-sm font-medium">
          {t('testimonials.form.body_label', 'Your story (min {count} characters)', {
            count: MIN_TESTIMONIAL_BODY_LENGTH,
          })}
        </label>
        <ExpandingInput
          id={`${idPrefix}-body`}
          rows={5}
          autoFocus={autoFocus}
          maxLength={MAX_TESTIMONIAL_BODY_LENGTH}
          className="w-full"
          placeholder={t(
            'testimonials.form.body_placeholder',
            'What were you looking for, what actually happened, and what would you tell someone deciding whether to join?',
          )}
          value={draft.body}
          onChange={(e) => set({body: e.target.value})}
        />
      </Col>

      <Checkbox
        label={t('testimonials.form.show_author', 'Show my name and photo next to it')}
        checked={draft.showAuthor}
        toggle={(checked) => set({showAuthor: checked})}
      />

      <div className="text-ink-400 text-xs">
        {t(
          'testimonials.form.moderation_note',
          'A moderator reviews every testimonial before it goes on the page.',
        )}
      </div>
    </Col>
  )
}
