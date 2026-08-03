import {HeartIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {useT} from 'web/lib/locale'

import {Col} from '../layout/col'
import {Row} from '../layout/row'
import {
  isTestimonialDraftValid,
  TestimonialDraftState,
  TestimonialForm,
} from '../testimonials/testimonial-form'

/**
 * The one deletion reason where asking for a testimonial is the right thing to do rather than a
 * parting nag: they are leaving because it worked.
 */
export const TESTIMONIAL_PROMPT_DELETION_REASON = 'found_connection_on_compass'

export const shouldPromptForTestimonial = (reason: string | null) =>
  reason === TESTIMONIAL_PROMPT_DELETION_REASON

/**
 * Whether the deletion may proceed.
 *
 * The ask is deliberately hard to walk past — a written testimonial, or a deliberate "no thanks" —
 * but it is never a wall. Opting out is one click and costs nothing, because holding someone's
 * account deletion hostage to a marketing asset would be the wrong trade at any conversion rate, and
 * in several jurisdictions is not a trade that is ours to make.
 */
export const canDeleteWithTestimonialPrompt = (
  draft: TestimonialDraftState,
  optedOut: boolean,
): boolean => optedOut || isTestimonialDraftValid(draft)

/**
 * Shown in the deletion survey when the stated reason is that they found someone here.
 *
 * The visual weight is on the ask, not on the opt-out: warm panel, heart, the composer open by
 * default and focused. The opt-out is a plain checkbox underneath — findable in a second, but not the
 * path of least resistance.
 */
export function TestimonialBeforeDelete({
  draft,
  setDraft,
  optedOut,
  setOptedOut,
}: {
  draft: TestimonialDraftState
  setDraft: (draft: TestimonialDraftState) => void
  optedOut: boolean
  setOptedOut: (optedOut: boolean) => void
}) {
  const t = useT()

  return (
    <Col
      className={clsx(
        'gap-4 rounded-xl p-5',
        'from-primary-50 ring-primary-300 dark:from-primary-900/25 bg-gradient-to-br to-canvas-50 ring-1',
      )}
      data-testid="testimonial-before-delete"
    >
      <Row className="items-start gap-3">
        <div className="bg-primary-100 dark:bg-primary-900/50 mt-0.5 shrink-0 rounded-full p-2">
          <HeartIcon className="text-primary-600 dark:text-primary-300 h-5 w-5" aria-hidden />
        </div>
        <Col className="gap-1">
          <div className="text-ink-900 font-semibold">
            {t('delete_survey.testimonial.title', 'You found someone. Would you say so publicly?')}
          </div>
          <div className="text-ink-700 text-sm leading-relaxed">
            {t(
              'delete_survey.testimonial.body',
              'This is the last thing we will ever ask of you, and it is the one thing we cannot do ourselves. Someone deciding whether Compass is worth trying will believe two sentences from you over anything we write. It takes a minute, and we will never contact you again.',
            )}
          </div>
        </Col>
      </Row>

      {!optedOut && (
        <TestimonialForm
          draft={draft}
          setDraft={setDraft}
          idPrefix="delete-testimonial"
          autoFocus
          className="pt-1"
        />
      )}

      {/* Not a <Checkbox>: that component sets `whitespace-nowrap` on its label, which overflows this
          panel on a phone. */}
      <label className="text-ink-500 flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          className="border-ink-300 bg-canvas-50 text-primary-600 focus:ring-primary-500 mt-0.5 h-4 w-4 shrink-0 rounded"
          checked={optedOut}
          onChange={(e) => setOptedOut(e.target.checked)}
          data-testid="testimonial-opt-out"
        />
        <span>
          {t(
            'delete_survey.testimonial.opt_out',
            'I would rather not write a testimonial — delete my account.',
          )}
        </span>
      </label>
    </Col>
  )
}
