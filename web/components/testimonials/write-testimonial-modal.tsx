import {CheckCircleIcon} from '@heroicons/react/24/solid'
import {APIError} from 'common/api/utils'
import {useState} from 'react'
import {requestReviewPrompt} from 'web/hooks/use-review-prompt'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

import {Button, ColorType, SizeType} from '../buttons/button'
import {Col} from '../layout/col'
import {Modal} from '../layout/modal'
import {Row} from '../layout/row'
import {
  EMPTY_TESTIMONIAL_DRAFT,
  isTestimonialDraftValid,
  TestimonialDraftState,
  TestimonialForm,
  toTestimonialProps,
} from './testimonial-form'

/**
 * The wall's "write one" flow.
 *
 * Signed-out visitors get sent to sign-up rather than a disabled button: a testimonial has to be
 * attributable to an account, and a dead control on the most prominent CTA of the page teaches people
 * the page is broken.
 */
export function WriteTestimonialButton({
  color = 'cta',
  size = 'lg',
  className,
  label,
}: {
  color?: ColorType
  size?: SizeType
  className?: string
  label?: string
}) {
  const t = useT()
  const user = useUser()
  const [open, setOpen] = useState(false)

  const text = label ?? t('testimonials.cta.write', 'Share your story')

  if (user === undefined) {
    // Auth still resolving. Render the button disabled rather than nothing, so the hero does not
    // reflow the moment auth settles.
    return (
      <Button color={color} size={size} className={className} disabled>
        {text}
      </Button>
    )
  }

  if (!user) {
    return (
      <Button
        color={color}
        size={size}
        className={className}
        onClick={() => (window.location.href = '/signup?next=/testimonials')}
      >
        {text}
      </Button>
    )
  }

  return (
    <>
      <Button color={color} size={size} className={className} onClick={() => setOpen(true)}>
        {text}
      </Button>
      <WriteTestimonialModal open={open} setOpen={setOpen} />
    </>
  )
}

export function WriteTestimonialModal({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const t = useT()
  const [draft, setDraft] = useState<TestimonialDraftState>(EMPTY_TESTIMONIAL_DRAFT)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = isTestimonialDraftValid(draft)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await api('create-testimonial', toTestimonialProps(draft))
      setSubmitted(true)
      setDraft(EMPTY_TESTIMONIAL_DRAFT)
    } catch (e) {
      // The one-per-member conflict comes back as a 400 with a sentence worth showing verbatim;
      // anything else gets a generic line rather than a stack trace.
      setError(
        e instanceof APIError
          ? e.message
          : t('testimonials.error.generic', 'Could not send your testimonial. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    setOpen(false)
    // Reset only after a success, so a failed send does not silently discard what they wrote.
    if (submitted) {
      setSubmitted(false)
      // On close rather than on submit: the modal stays open on its success state, and a store card
      // cannot be asked for over the top of an open dialog. The delay clears the leave transition.
      //
      // Keyed on having submitted at all, never on the rating — routing only the happy answers to a
      // store card is review gating, which both stores prohibit. See docs/app-store-reviews.md §3.
      requestReviewPrompt('testimonial-submitted', 800)
    }
  }

  return (
    <Modal open={open} setOpen={(o) => (o ? setOpen(true) : close())} size="lg">
      {/* Own height cap rather than MODAL_CLASS: that one is a fixed near-viewport height, which leaves
          the success state floating in the middle of an otherwise empty sheet. */}
      <Col className="bg-canvas-0 max-h-[85dvh] gap-5 overflow-auto rounded-2xl p-6 sm:p-8">
        {submitted ? (
          <Col className="items-center gap-3 py-6 text-center">
            <CheckCircleIcon className="text-primary-500 h-12 w-12" aria-hidden />
            <div className="text-ink-900 text-xl font-semibold">
              {t('testimonials.submitted.title', 'Thank you — that means a lot')}
            </div>
            <div className="text-ink-600 max-w-sm text-sm">
              {t(
                'testimonials.submitted.body',
                'A moderator will read it shortly. Once it is approved it appears on this page.',
              )}
            </div>
            <Button color="gray-outline" onClick={close} className="mt-2">
              {t('testimonials.submitted.close', 'Close')}
            </Button>
          </Col>
        ) : (
          <>
            <Col className="gap-1">
              <div className="text-ink-900 text-xl font-semibold">
                {t('testimonials.modal.title', 'Share your story')}
              </div>
              <div className="text-ink-500 text-sm">
                {t(
                  'testimonials.modal.subtitle',
                  'The people deciding whether to join read these before anything else we write.',
                )}
              </div>
            </Col>

            <TestimonialForm draft={draft} setDraft={setDraft} autoFocus />

            {error && <div className="text-error text-sm">{error}</div>}

            <Row className="justify-end gap-3">
              <Button color="gray-white" onClick={close} disabled={submitting}>
                {t('testimonials.modal.cancel', 'Cancel')}
              </Button>
              <Button
                color={valid ? 'cta' : 'gray'}
                disabled={!valid}
                loading={submitting}
                onClick={submit}
              >
                {t('testimonials.modal.submit', 'Send for review')}
              </Button>
            </Row>
          </>
        )}
      </Col>
    </Modal>
  )
}
