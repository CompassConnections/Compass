import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {CheckBadgeIcon} from '@heroicons/react/24/solid'
import {PrivateUser} from 'common/src/user'
import {updateEmail} from 'firebase/auth'
import {useState} from 'react'
import {useForm} from 'react-hook-form'
import toast from 'react-hot-toast'
import {Button} from 'web/components/buttons/button'
import {ConnectionPreferencesSettings} from 'web/components/connection-preferences-settings'
import {EmailVerificationButton} from 'web/components/email-verification-button'
import {FontPicker} from 'web/components/font-picker'
import {LanguagePicker} from 'web/components/language/language-picker'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import MeasurementSystemToggle from 'web/components/measurement-system-toggle'
import {DeleteAccountSurveyModal} from 'web/components/profile/delete-account-survey-modal'
import HiddenProfilesModal from 'web/components/settings/hidden-profiles-modal'
import {SettingsCard, SettingsRow} from 'web/components/settings/settings-card'
import {ThemePicker} from 'web/components/settings/theme-picker'
import {WithPrivateUser} from 'web/components/user/with-user'
import {Input} from 'web/components/widgets/input'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import {useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {sendPasswordReset} from 'web/lib/firebase/password'
import {useT} from 'web/lib/locale'
import {isNativeMobile} from 'web/lib/util/webview'

export const GeneralSettings = () => (
  <WithPrivateUser>{(user) => <LoadedGeneralSettings privateUser={user} />}</WithPrivateUser>
)

/** Cards enter in sequence rather than all at once, so the eye is led down the column. */
const enter = (index: number) => ({animationDelay: `${index * 60}ms`})

const LoadedGeneralSettings = (props: {privateUser: PrivateUser}) => {
  const {privateUser} = props

  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [showHiddenProfiles, setShowHiddenProfiles] = useState(false)
  const {
    register,
    handleSubmit,
    formState: {errors},
    reset,
  } = useForm<{newEmail: string}>()
  const t = useT()

  const firebaseUser = useFirebaseUser()
  if (!firebaseUser) return null

  const changeUserEmail = async (newEmail: string) => {
    if (!firebaseUser) return

    try {
      await updateEmail(firebaseUser, newEmail)
      toast.success(t('settings.email.updated_success', 'Email updated successfully'))
      setIsChangingEmail(false)
      reset()
      // Force a reload to update the UI with the new email
      // window.location.reload()
    } catch (error: any) {
      console.error('Error updating email:', error)
      toast.error(error.message || t('settings.email.update_failed', 'Failed to update email'))
    }
  }

  const onSubmitEmailChange = (data: {newEmail: string}) => {
    if (!firebaseUser) return
    if (data.newEmail === firebaseUser.email) {
      toast.error(t('settings.email.same_as_current', 'New email is the same as current email'))
      return
    }
    changeUserEmail(data.newEmail)
  }

  const isEmailVerified = firebaseUser.emailVerified

  return (
    <>
      <Col className="mt-4 w-full gap-6" data-settings-sections>
        <SettingsCard
          id="settings-appearance"
          icon={<PaintBrushIcon />}
          title={t('settings.section.appearance', 'Appearance & language')}
          description={t(
            'settings.section.appearance_description',
            'How Compass looks and reads on this device.',
          )}
          style={enter(0)}
        >
          <SettingsRow
            htmlFor="locale-picker"
            label={t('settings.general.language', 'Language')}
            description={t(
              'settings.general.language_description',
              'The language of the interface.',
            )}
          >
            <LanguagePicker className={'w-full min-w-[160px] !bg-canvas-0 sm:w-fit'} />
          </SettingsRow>

          <SettingsRow
            label={t('settings.general.theme', 'Theme')}
            description={t(
              'settings.general.theme_description',
              'Auto follows your device’s light or dark setting.',
            )}
          >
            <ThemePicker />
          </SettingsRow>

          <SettingsRow
            htmlFor="font-picker"
            label={t('settings.general.font', 'Font')}
            description={t(
              'settings.general.font_description',
              'Atkinson Hyperlegible is designed for easier reading.',
            )}
          >
            <FontPicker className={'w-full min-w-[200px] !bg-canvas-0 sm:w-fit'} />
          </SettingsRow>

          <SettingsRow
            label={t('settings.general.measurement', 'Measurement System')}
            description={t(
              'settings.general.measurement_description',
              'Used for heights and distances.',
            )}
          >
            <MeasurementSystemToggle />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard
          id="settings-privacy"
          icon={<ShieldCheckIcon />}
          title={t('settings.data_privacy.title', 'Data & Privacy')}
          description={t(
            'settings.data_privacy.card_description',
            'Everything Compass holds about you is yours to take.',
          )}
          style={enter(1)}
        >
          <DataPrivacySettings />
        </SettingsCard>

        <SettingsCard
          id="settings-people"
          icon={<EyeSlashIcon />}
          title={t('settings.general.people', 'People')}
          description={t(
            'settings.people.card_description',
            'Profiles you have chosen not to see.',
          )}
          style={enter(2)}
        >
          <SettingsRow
            label={t('settings.hidden_profiles.title', 'Hidden profiles')}
            description={t(
              'settings.hidden_profiles.description',
              'Hidden profiles stay out of your browsing and search results.',
            )}
          >
            <Button
              color={'gray-outline'}
              onClick={() => setShowHiddenProfiles(true)}
              className="w-full sm:w-fit"
            >
              {t('settings.hidden_profiles.manage', 'Manage hidden profiles')}
            </Button>
          </SettingsRow>
        </SettingsCard>

        <SettingsCard
          id="settings-connections"
          icon={<SparklesIcon />}
          title={t('settings.connection_preferences.title', 'Connection Preferences')}
          description={t(
            'settings.connection_preferences.description',
            'Control how others can connect with you.',
          )}
          style={enter(3)}
        >
          <ConnectionPreferencesSettings />
        </SettingsCard>

        <SettingsCard
          id="settings-account"
          icon={<UserCircleIcon />}
          title={t('settings.general.account', 'Account')}
          description={t(
            'settings.account.card_description',
            'How you sign in and how we reach you.',
          )}
          style={enter(4)}
        >
          {/* The address itself, not just buttons that act on it. The old layout offered "Change
              email address" without ever saying what the current one was. */}
          <SettingsRow
            stacked={isChangingEmail}
            label={t('settings.general.email', 'Email')}
            description={
              <Row className="flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-ink-700 break-all">{privateUser?.email}</span>
                {isEmailVerified ? (
                  <span className="text-ink-500 inline-flex items-center gap-1 text-xs">
                    <CheckBadgeIcon className="h-4 w-4 text-teal-500" aria-hidden />
                    {t('settings.email.verified_short', 'Verified')}
                  </span>
                ) : (
                  <span className="text-red-500 text-xs">
                    {t('settings.email.unverified_short', 'Not verified')}
                  </span>
                )}
              </Row>
            }
          >
            {!isChangingEmail ? (
              <Button
                color={'gray-outline'}
                onClick={() => setIsChangingEmail(true)}
                className="w-full sm:w-fit"
              >
                {t('settings.email.change', 'Change email address')}
              </Button>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmitEmailChange)}
                className="flex w-full flex-col gap-2 sm:max-w-sm"
              >
                <Col>
                  <Input
                    type="email"
                    placeholder={t('settings.email.new_placeholder', 'New email address')}
                    {...register('newEmail', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('settings.email.invalid', 'Invalid email address'),
                      },
                    })}
                    disabled={!firebaseUser}
                  />
                  {errors.newEmail && (
                    <span className="text-red-500 text-sm">
                      {errors.newEmail.message === 'Email is required'
                        ? t('settings.email.required', 'Email is required')
                        : errors.newEmail.message}
                    </span>
                  )}
                </Col>
                <div className="flex gap-2">
                  <Button type="submit" color="green" className="w-fit">
                    {t('settings.action.save', 'Save')}
                  </Button>
                  <Button
                    type="button"
                    color="gray"
                    onClick={() => {
                      setIsChangingEmail(false)
                      reset()
                    }}
                    className="w-fit"
                  >
                    {t('settings.action.cancel', 'Cancel')}
                  </Button>
                </div>
              </form>
            )}
          </SettingsRow>

          {/* Only worth a row while there is something to do about it. */}
          {!isEmailVerified && (
            <SettingsRow
              label={t('settings.email.verify', 'Verify your email')}
              description={t(
                'settings.email.verify_description',
                'Some features stay locked until your address is confirmed.',
              )}
            >
              <EmailVerificationButton />
            </SettingsRow>
          )}

          <SettingsRow
            label={t('settings.general.password', 'Password')}
            description={t(
              'settings.password.description',
              'We’ll email you a link to choose a new one.',
            )}
          >
            <Button
              onClick={() => sendPasswordReset(privateUser?.email)}
              className="w-full sm:w-fit"
              color={'gray-outline'}
            >
              {t('settings.password.send_reset', 'Send password reset email')}
            </Button>
          </SettingsRow>
        </SettingsCard>

        <SettingsCard
          id="settings-danger"
          icon={<ExclamationTriangleIcon />}
          tone="danger"
          title={t('settings.danger_zone', 'Danger Zone')}
          description={t(
            'settings.danger_zone.description',
            'Deleting your account removes your profile, messages and answers. This cannot be undone.',
          )}
          style={enter(5)}
        >
          <SettingsRow
            label={t('settings.delete_account', 'Delete account')}
            description={t(
              'settings.delete_account.description',
              'You’ll be asked why before anything is removed.',
            )}
          >
            <DeleteAccountSurveyModal />
          </SettingsRow>
        </SettingsCard>
      </Col>

      {/* Hidden profiles modal */}
      <HiddenProfilesModal open={showHiddenProfiles} setOpen={setShowHiddenProfiles} />
    </>
  )
}

const DataPrivacySettings = () => {
  const t = useT()
  const user = useUser()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return

    try {
      setIsDownloading(true)
      const data = await api('me/data', {})
      const jsonString = JSON.stringify(data, null, 2)
      const filename = `compass-data-export${user?.username ? `-${user.username}` : ''}.json`
      if (isNativeMobile() && window.AndroidBridge && window.AndroidBridge.downloadFile) {
        window.AndroidBridge.downloadFile(filename, jsonString)
      } else {
        const blob = new Blob([jsonString], {type: 'application/json'})
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      toast.success(
        t('settings.data_privacy.download.success', 'Your data export has been downloaded.'),
      )
    } catch (e) {
      console.error('Error downloading data export', e)
      toast.error(
        t(
          'settings.data_privacy.download.error',
          'Failed to download your data. Please try again.',
        ),
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <SettingsRow
      label={t('settings.data_privacy.export', 'Export your data')}
      description={t(
        'settings.data_privacy.description',
        'Download a JSON file containing all your information: profile, account, messages, compatibility answers, starred profiles, votes, endorsements, search bookmarks, etc.',
      )}
    >
      <Button
        color="gray-outline"
        onClick={handleDownload}
        className="w-full sm:w-fit"
        disabled={isDownloading}
        loading={isDownloading}
      >
        <ArrowDownTrayIcon className="mr-2 h-4 w-4" aria-hidden />
        {isDownloading
          ? t('settings.data_privacy.downloading', 'Downloading...')
          : t('settings.data_privacy.download', 'Download all my data')}
      </Button>
    </SettingsRow>
  )
}
