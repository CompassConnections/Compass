import {RadioGroup} from '@headlessui/react'
import router from 'next/router'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {useT} from 'web/lib/locale'
import {deleteAccount} from 'web/lib/util/delete'

import {ConfirmationButton} from '../buttons/confirmation-button'
import {Col} from '../layout/col'
import {Title} from '../widgets/title'

export function DeleteAccountSurveyModal() {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [reasonFreeText, setReasonFreeText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useT()

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

    low_response_rate: t(
      'delete_survey.reasons.low_response_rate',
      'Messages often went unanswered',
    ),

    platform_not_active_enough: t(
      'delete_survey.reasons.platform_not_active_enough',
      'The community didn’t feel active enough',
    ),

    not_meeting_depth_expectations: t(
      'delete_survey.reasons.not_meeting_depth_expectations',
      'Interactions felt more surface-level than expected',
    ),

    too_much_time_or_effort: t(
      'delete_survey.reasons.too_much_time_or_effort',
      'Using the platform required more time or effort than I can give',
    ),

    prefer_simpler_apps: t(
      'delete_survey.reasons.prefer_simpler_apps',
      'I prefer simpler or faster apps',
    ),

    privacy_concerns: t(
      'delete_survey.reasons.privacy_concerns',
      'Concerns about privacy or profile visibility',
    ),

    technical_issues: t('delete_survey.reasons.technical_issues', 'Technical issues or bugs'),

    taking_a_break: t(
      'delete_survey.reasons.taking_a_break',
      'I’m taking a break from meeting apps',
    ),

    life_circumstances_changed: t(
      'delete_survey.reasons.life_circumstances_changed',
      'My life circumstances changed',
    ),

    other: t('delete_survey.reasons.other', 'Other'),
  }

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
          console.log('Failed to delete account')
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

  return (
    <ConfirmationButton
      openModalBtn={{
        className: 'p-2',
        label: t('delete_yourself.open_label', 'Delete account'),
        color: 'red',
      }}
      submitBtn={{
        label: t('delete_yourself.submit', 'Delete account'),
        color: selectedReason ? 'red' : 'gray',
        isSubmitting: isSubmitting,
        disabled: !(selectedReason && reasonFreeText),
      }}
      onSubmitWithSuccess={handleDeleteAccount}
      disabled={false}
    >
      <Col className="gap-4">
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

            <div className="space-y-2 mt-2">
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

          {
            <div className="mt-4">
              <label htmlFor="otherReason" className="block text-sm font-medium">
                {t('delete_survey.other_placeholder', 'Please share more details')}*
              </label>
              <div className="mt-1">
                <textarea
                  id="otherReason"
                  rows={3}
                  className="block w-full bg-canvas-0 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={t('delete_survey.other_placeholder', 'Please share more details')}
                  value={reasonFreeText}
                  onChange={(e) => setReasonFreeText(e.target.value)}
                />
              </div>
            </div>
          }
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
