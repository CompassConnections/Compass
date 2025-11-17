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
import {useRedirectIfSignedOut} from "web/hooks/use-redirect-if-signed-out";
import {deleteAccount} from "web/lib/util/delete";
import router from "next/router";
import {Button} from "web/components/buttons/button";
import {sendEmailVerification, updateEmail} from 'firebase/auth';
import {auth} from "web/lib/firebase/users";
import {NotificationSettings} from "web/components/notifications";
import ThemeIcon from "web/components/theme-icon";
import {WithPrivateUser} from "web/components/user/with-user";
import {sendPasswordReset} from "web/lib/firebase/password";

export default function NotificationsPage() {
  useRedirectIfSignedOut()
  return (
    <PageBase trackPageView={'settings page'} className={'mx-4'}>
      <NoSEO/>
      <Title>Settings</Title>
      <UncontrolledTabs
        name={'settings-page'}
        tabs={[
          {title: 'General', content: <GeneralSettings/>},
          {title: 'Notifications', content: <NotificationSettings/>},
        ]}
        trackingName={'settings page'}
      />
    </PageBase>
  )
}

export const GeneralSettings = () => (
  <WithPrivateUser>
    {user => <LoadedGeneralSettings privateUser={user}/>}
  </WithPrivateUser>
)

const LoadedGeneralSettings = (props: {
  privateUser: PrivateUser,
}) => {
  const {privateUser} = props

  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const {register, handleSubmit, formState: {errors}, reset} = useForm<{ newEmail: string }>()

  const user = auth.currentUser
  if (!user) return null

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your profile? This cannot be undone.'
    )
    if (confirmed) {
      toast
        .promise(deleteAccount(), {
          loading: 'Deleting account...',
          success: () => {
            router.push('/')
            return 'Your account has been deleted.'
          },
          error: () => {
            return 'Failed to delete account.'
          },
        })
        .catch(() => {
          console.log("Failed to delete account")
        })
    }
  }

  const changeUserEmail = async (newEmail: string) => {
    if (!user) return

    try {
      await updateEmail(user, newEmail)
      toast.success('Email updated successfully')
      setIsChangingEmail(false)
      reset()
      // Force a reload to update the UI with the new email
      // window.location.reload()
    } catch (error: any) {
      console.error('Error updating email:', error)
      toast.error(error.message || 'Failed to update email')
    }
  }

  const onSubmitEmailChange = (data: { newEmail: string }) => {
    if (!user) return
    if (data.newEmail === user.email) {
      toast.error('New email is the same as current email')
      return
    }
    changeUserEmail(data.newEmail)
  }


  const sendVerificationEmail = async () => {
    if (!privateUser?.email) {
      toast.error('No email found on your account.')
      return
    }
    if (!user) {
      toast.error('You must be signed in to send a verification email.')
      return
    }
    toast
      .promise(sendEmailVerification(user), {
        loading: 'Sending verification email...',
        success: 'Verification email sent — check your inbox and spam.',
        error: 'Failed to send verification email.',
      })
      .catch(() => {
        console.log("Failed to send verification email")
      })
  }

  const isEmailVerified = user.emailVerified

  return <>
    <div className="flex flex-col gap-2 max-w-fit">
      <h3>Theme</h3>
      <ThemeIcon className="h-6 w-6"/>
      <h3>Account</h3>
      <h5>Email</h5>

      <Button onClick={sendVerificationEmail} disabled={!privateUser?.email || isEmailVerified}>
        {isEmailVerified ? 'Email Verified ✔️' : 'Send verification email'}
      </Button>

      {!isChangingEmail ? (
        <Button onClick={() => setIsChangingEmail(true)}>
          Change email address
        </Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmitEmailChange)} className="flex flex-col gap-2">
          <Col>
            <Input
              type="email"
              placeholder="New email address"
              {...register('newEmail', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              disabled={!user}
            />
            {errors.newEmail && (
              <span className="text-red-500 text-sm">{errors.newEmail.message}</span>
            )}
          </Col>
          <div className="flex gap-2">
            <Button type="submit" color="green">
              Save
            </Button>
            <Button
              type="button"
              color="gray"
              onClick={() => {
                setIsChangingEmail(false)
                reset()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <h5>Password</h5>
      <Button
        onClick={() => sendPasswordReset(privateUser?.email)}
        className="mb-2"
      >
        Send password reset email
      </Button>

      <h5>Danger Zone</h5>
      <Button color="red" onClick={handleDeleteAccount}>
        Delete Account
      </Button>
    </div>
  </>
}

