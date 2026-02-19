import {useState} from 'react'
import {PrivateUser} from 'common/src/user'
import {useForm} from 'react-hook-form'
import {Input} from 'web/components/widgets/input'
import {Col} from 'web/components/layout/col'
import toast from 'react-hot-toast'
import {NoSEO} from 'web/components/NoSEO'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {PageBase} from 'web/components/page-base'
import {Title} from 'web/components/widgets/title'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {deleteAccount} from 'web/lib/util/delete'
import router from 'next/router'
import {Button} from 'web/components/buttons/button'
import {updateEmail} from 'firebase/auth'
import {NotificationSettings} from 'web/components/notifications'
import ThemeIcon from 'web/components/theme-icon'
import {WithPrivateUser} from 'web/components/user/with-user'
import {sendPasswordReset} from 'web/lib/firebase/password'
import {AboutSettings} from 'web/components/about-settings'
import {LanguagePicker} from 'web/components/language/language-picker'
import {FontPicker} from 'web/components/font-picker'
import {useT} from 'web/lib/locale'
import HiddenProfilesModal from 'web/components/settings/hidden-profiles-modal'
import {EmailVerificationButton} from 'web/components/email-verification-button'
import {api} from 'web/lib/api'
import {useUser} from 'web/hooks/use-user'
import {isNativeMobile} from 'web/lib/util/webview'
import {useFirebaseUser} from 'web/hooks/use-firebase-user'
import MeasurementSystemToggle from 'web/components/measurement-system-toggle'

export default function NotificationsPage() {
  const t = useT()
  useRedirectIfSignedOut()
  return (
    <PageBase trackPageView={'settings page'} className={'mx-4 mb-4'}>
      <NoSEO />
      <Title>{t('settings.title', 'Settings')}</Title>
      <UncontrolledTabs
        name={'settings-page'}
        tabs={[
          {
            title: t('settings.tabs.general', 'General'),
            content: <GeneralSettings />,
          },
          {
            title: t('settings.tabs.notifications', 'Notifications'),
            content: <NotificationSettings />,
          },
          {
            title: t('settings.tabs.about', 'About'),
            content: <AboutSettings />,
          },
        ]}
        trackingName={'settings page'}
      />
    </PageBase>
  )
}

export const GeneralSettings = () => (
  <WithPrivateUser>{(user) => <LoadedGeneralSettings privateUser={user} />}</WithPrivateUser>
)

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

  const user = useFirebaseUser()
  if (!user) return null

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      t(
        'settings.delete_confirm',
        'Are you sure you want to delete your profile? This cannot be undone.',
      ),
    )
    if (confirmed) {
      toast
        .promise(deleteAccount(), {
          loading: t('settings.delete.loading', 'Deleting account...'),
          success: () => {
            router.push('/')
            return t('settings.delete.success', 'Your account has been deleted.')
          },
          error: () => {
            return t('settings.delete.error', 'Failed to delete account.')
          },
        })
        .catch(() => {
          console.log('Failed to delete account')
        })
    }
  }

  const changeUserEmail = async (newEmail: string) => {
    if (!user) return

    try {
      await updateEmail(user, newEmail)
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
    if (!user) return
    if (data.newEmail === user.email) {
      toast.error(t('settings.email.same_as_current', 'New email is the same as current email'))
      return
    }
    changeUserEmail(data.newEmail)
  }

  return (
    <>
      <div className="flex flex-col gap-2 max-w-fit">
        <h3>{t('settings.general.language', 'Language')}</h3>
        <LanguagePicker className={'w-fit min-w-[120px]'} />

        <h3>{t('settings.general.measurement', 'Measurement System')}</h3>
        <MeasurementSystemToggle />

        <h3>{t('settings.general.theme', 'Theme')}</h3>
        <ThemeIcon className="h-6 w-6" />

        <h3>{t('settings.general.font', 'Font')}</h3>
        <FontPicker className={'w-fit min-w-[180px]'} />

        <h3>{t('settings.data_privacy.title', 'Data & Privacy')}</h3>
        <DataPrivacySettings />

        <h3>{t('settings.general.people', 'People')}</h3>
        {/*<h5>{t('settings.hidden_profiles.title', 'Hidden profiles')}</h5>*/}
        <Button
          color={'gray-outline'}
          onClick={() => setShowHiddenProfiles(true)}
          className="w-fit"
        >
          {t('settings.hidden_profiles.manage', 'Manage hidden profiles')}
        </Button>

        <h3>{t('settings.general.account', 'Account')}</h3>
        <h5>{t('settings.general.email', 'Email')}</h5>

        <EmailVerificationButton />

        {!isChangingEmail ? (
          <Button color={'gray-outline'} onClick={() => setIsChangingEmail(true)} className="w-fit">
            {t('settings.email.change', 'Change email address')}
          </Button>
        ) : (
          <form onSubmit={handleSubmit(onSubmitEmailChange)} className="flex flex-col gap-2">
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
                disabled={!user}
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

        <h5>{t('settings.general.password', 'Password')}</h5>
        <Button
          onClick={() => sendPasswordReset(privateUser?.email)}
          className="mb-2 max-w-[250px] w-fit"
          color={'gray-outline'}
        >
          {t('settings.password.send_reset', 'Send password reset email')}
        </Button>

        <h5>{t('settings.danger_zone', 'Danger Zone')}</h5>
        <Button color="red" onClick={handleDeleteAccount} className="w-fit">
          {t('settings.delete_account', 'Delete Account')}
        </Button>
      </div>

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
    <div className="flex flex-col gap-4 max-w-xl">
      <p className="text-sm guidance">
        {t(
          'settings.data_privacy.description',
          'Download a JSON file containing all your information: profile, account, messages, compatibility answers, starred profiles, votes, endorsements, search bookmarks, etc.',
        )}
      </p>
      <Button
        color="gray-outline"
        onClick={handleDownload}
        className="w-fit"
        disabled={isDownloading}
        loading={isDownloading}
      >
        {isDownloading
          ? t('settings.data_privacy.downloading', 'Downloading...')
          : t('settings.data_privacy.download', 'Download all my data (JSON)')}
      </Button>
    </div>
  )
}
