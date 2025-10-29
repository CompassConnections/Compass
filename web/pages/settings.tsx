import {PrivateUser} from 'common/src/user'
import {NoSEO} from 'web/components/NoSEO'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {PageBase} from 'web/components/page-base'
import {Title} from 'web/components/widgets/title'
import {usePrivateUser} from 'web/hooks/use-user'
import {useRedirectIfSignedOut} from "web/hooks/use-redirect-if-signed-out";
import toast from "react-hot-toast";
import {deleteAccount} from "web/lib/util/delete";
import router from "next/router";
import {Button} from "web/components/buttons/button";
import {getAuth, sendEmailVerification, sendPasswordResetEmail} from 'firebase/auth';
import {auth} from "web/lib/firebase/users";
import {NotificationSettings} from "web/components/notifications";
import ThemeIcon from "web/components/theme-icon";
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";

export default function NotificationsPage() {
  useRedirectIfSignedOut()
  return (
    <PageBase trackPageView={'settings page'} className={'mx-4'}>
      <NoSEO/>
      <Title>Settings</Title>
      <UncontrolledTabs
        tabs={[
          {title: 'General', content: <GeneralSettings/>},
          {title: 'Notifications', content: <NotificationSettings/>},
        ]}
        trackingName={'settings page'}
      />
    </PageBase>
  )
}

export const GeneralSettings = () => {
  const privateUser = usePrivateUser()
  if (!privateUser) return <CompassLoadingIndicator/>
  return <LoadedGeneralSettings privateUser={privateUser}/>
}

const LoadedGeneralSettings = (props: {
  privateUser: PrivateUser,
}) => {
  const {privateUser} = props
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

  const sendPasswordReset = async () => {
    if (!privateUser?.email) {
      toast.error('No email found on your account.')
      return
    }
    const auth = getAuth()
    toast.promise(
      sendPasswordResetEmail(auth, privateUser.email),
      {
        loading: 'Sending password reset email...',
        success: 'Password reset email sent — check your inbox and spam.',
        error: 'Failed to send password reset email.',
      }
    )
      .catch(() => {
        console.log("Failed to send password reset email")
      })
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
      <h5>Credentials</h5>
      <Button
        onClick={sendPasswordReset}
      >
        Send password reset email
      </Button>

      <h5>Verification</h5>
      <Button onClick={sendVerificationEmail} disabled={!privateUser?.email || isEmailVerified}>
        {isEmailVerified ? 'Email Verified' : 'Send verification email'}
      </Button>

      <h5>Dangerous</h5>
      <Button color="red" onClick={handleDeleteAccount}>
        Delete Account
      </Button>
    </div>
  </>
}

