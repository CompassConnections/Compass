import {RadioGroup} from '@headlessui/react'
import clsx from 'clsx'
import router from 'next/router'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {useT} from 'web/lib/locale'
import {deleteAccount} from 'web/lib/util/delete'

import {ConfirmationButton} from '../buttons/confirmation-button'
import {Col} from '../layout/col'
import {
  EMPTY_TESTIMONIAL_DRAFT,
  isTestimonialDraftValid,
  TestimonialDraftState,
  toTestimonialProps,
} from '../testimonials/testimonial-form'
import {Title} from '../widgets/title'
import {shouldShowStayPitch, StayInsteadOfDelete} from './stay-instead-of-delete'
import {
  canDeleteWithTestimonialPrompt,
  shouldPromptForTestimonial,
  TestimonialBeforeDelete,
} from './testimonial-before-delete'

export function DeleteAccountSurveyModal() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [reasonFreeText, setReasonFreeText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testimonialDraft, setTestimonialDraft] =
    useState<TestimonialDraftState>(EMPTY_TESTIMONIAL_DRAFT)
  const [testimonialOptedOut, setTestimonialOptedOut] = useState(false)
  const t = useT()

  /**
   * Deliberately short. A leaving screen is not a research survey: fourteen options made the page a
   * wall of text at the exact moment someone has already decided, and the long tail of them
   * (privacy, bugs, "prefer simpler apps", ...) each drew a handful of clicks that the mandatory
   * details box captures better as prose. Six buckets, each one distinguishable at a glance.
   */
  const reasonsMap: Record<string, string> = {
    found_connection_on_compass: t(
      'delete_survey.reasons.found_connection_on_compass',
      'I found a meaningful connection on Compass',
    ),

    found_connection_elsewhere: t(
      'delete_survey.reasons.found_connection_elsewhere',
      'I found a connection elsewhere',
    ),

    not_enough_relevant_people: t(
      'delete_survey.reasons.not_enough_relevant_people',
      'Not enough relevant people near me',
    ),

    conversations_didnt_progress: t(
      'delete_survey.reasons.conversations_didnt_progress',
      'Conversations didn’t turn into real connections',
    ),

    taking_a_break: t(
      'delete_survey.reasons.taking_a_break',
      'I’m taking a break from meeting apps',
    ),

    other: t('delete_survey.reasons.other', 'Other'),
  }

  const promptForTestimonial = shouldPromptForTestimonial(selectedReason)

  // Sent only when they actually finished one: opting out, picking a different reason after typing
  // something, or leaving the box half-written must not smuggle a draft through. The validity check
  // also has to be here rather than only on the submit button, because everything below keys off
  // this — a half-written draft must not yet count as having replaced the details field.
  const testimonialToSend =
    promptForTestimonial && !testimonialOptedOut && isTestimonialDraftValid(testimonialDraft)
      ? toTestimonialProps(testimonialDraft)
      : undefined

  /**
   * The free-text box exists to find out why someone left, which a testimonial already answers at
   * length. Asking them to write the same thing twice — and blocking the button until they do — is
   * how a thoughtful reply turns into "n/a" in both fields.
   */
  const detailsRequired = !testimonialToSend

  const handleDeleteAccount = async () => {
    setDeleteError(null) // Clear previous errors

    // if (!selectedReason) {}
    // setDeleteError()
    setIsSubmitting(true)

    // Delete the account (now includes storing the deletion reason)
    try {
      toast
        .promise(
          deleteAccount({
            reasonCategory: selectedReason,
            reasonDetails: reasonFreeText,
            testimonial: testimonialToSend,
          }),
          {
            loading: t('delete_yourself.toast.loading', 'Deleting account...'),
            success: () => {
              router.push('/')
              return t('delete_yourself.toast.success', 'Your account has been deleted.')
            },
            error: () => {
              setDeleteError(t('delete_yourself.toast.error', 'Failed to delete account.'))
              return t('delete_yourself.toast.error', 'Failed to delete account.')
            },
          },
        )
        .catch(() => {
          setDeleteError(t('delete_survey.error_saving_reason', 'Error deleting account'))
          console.error('Failed to delete account')
        })

      return true
    } catch (error) {
      console.error('Error deleting account:', error)
      setDeleteError(t('delete_survey.error_saving_reason', 'Error deleting account'))
      toast.error(t('delete_survey.error_saving_reason', 'Error deleting account'))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const showStayPitch = shouldShowStayPitch(selectedReason)

  return (
    <ConfirmationButton
      openModalBtn={{
        className: 'p-2 w-full sm:w-fit',
        label: t('delete_yourself.open_label', 'Delete account'),
        // Outline, not solid. On the settings page this was the only coloured button among a dozen
        // grey ones, which made the irreversible action the most prominent thing on the page. The
        // modal's own confirm button is still solid red — the emphasis belongs where the decision is.
        color: 'red-outline',
      }}
      cancelBtn={
        showStayPitch
          ? {
              label: t('delete_survey.stay.keep_account', 'Keep my account'),
              color: 'indigo',
            }
          : undefined
      }
      submitBtn={{
        label: testimonialToSend
          ? t('delete_survey.testimonial.submit', 'Share it and delete my account')
          : t('delete_yourself.submit', 'Delete account'),
        color: selectedReason ? 'red' : 'gray',
        isSubmitting: isSubmitting,
        // The testimonial ask is a gate, not a wall: it blocks the button only until they have either
        // written something usable or ticked the opt-out. Both take a moment; neither can be missed.
        // A written testimonial also stands in for the details box, so there is never a moment where
        // two long-form fields are required at once.
        disabled:
          !selectedReason ||
          (detailsRequired && !reasonFreeText) ||
          (promptForTestimonial &&
            !canDeleteWithTestimonialPrompt(testimonialDraft, testimonialOptedOut)),
      }}
      onSubmitWithSuccess={handleDeleteAccount}
      disabled={false}
    >
      <Col className="gap-4" data-testid="delete-survey-modal">
        <Title>{t('delete_survey.title', 'Sorry to see you go')}</Title>

        <div>
          {t(
            'delete_survey.description',
            "We're sorry to see you go. To help us improve Compass, please let us know why you're deleting your account.",
          )}
        </div>

        <div className="w-full">
          <RadioGroup value={selectedReason} onChange={setSelectedReason} className="space-y-2">
            <RadioGroup.Label className="text-sm font-medium">
              {t('delete_survey.reason_label', 'Why are you deleting your account?')}
            </RadioGroup.Label>

            <div className="space-y-2 mt-2" data-testid="delete-account-survey-reasons">
              {Object.entries(reasonsMap).map(([key, value]) => (
                <RadioGroup.Option
                  key={key}
                  value={key}
                  className={({checked}) =>
                    `${
                      checked ? 'bg-canvas-100' : 'border-gray-300'
                    } relative block cursor-pointer rounded-lg border p-4 focus:bg-canvas-100`
                  }
                >
                  {({checked}) => (
                    <div className="flex items-center">
                      <div className="flex h-5 items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          checked={checked}
                          readOnly
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <RadioGroup.Label as="span" className={`font-medium`}>
                          {value}
                        </RadioGroup.Label>
                      </div>
                    </div>
                  )}
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>

          {promptForTestimonial && (
            <div className="mt-4">
              <TestimonialBeforeDelete
                draft={testimonialDraft}
                setDraft={setTestimonialDraft}
                optedOut={testimonialOptedOut}
                setOptedOut={setTestimonialOptedOut}
              />
            </div>
          )}

          {showStayPitch && (
            <div className="mt-4">
              <StayInsteadOfDelete />
            </div>
          )}

          {detailsRequired && (
            <div className="mt-4">
              <label
                htmlFor="otherReason"
                className={clsx('block text-sm font-medium', !detailsRequired && 'text-ink-400')}
              >
                {t('delete_survey.other_placeholder', 'Please share more details')}
                {detailsRequired && '*'}
              </label>
              <div className="mt-1">
                <textarea
                  id="otherReason"
                  data-testid="delete-survey-details"
                  rows={3}
                  // Disabled rather than hidden: a field that vanishes as you type in another one
                  // reads as a bug, and the greyed-out box with a reason under it is what makes it
                  // obvious the testimonial replaced it.
                  disabled={!detailsRequired}
                  className="block w-full bg-canvas-50 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t('delete_survey.other_placeholder', 'Please share more details')}
                  value={reasonFreeText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReasonFreeText(e.target.value)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Error message display */}
        {deleteError && (
          <div className="rounded-md">
            <h3 className="text-sm font-medium text-red-800">
              {t('delete_survey.error_title', 'Error')}: {deleteError}
            </h3>
          </div>
        )}
      </Col>
    </ConfirmationButton>
  )
}
