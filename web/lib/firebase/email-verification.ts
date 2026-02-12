import toast from "react-hot-toast";
import {sendEmailVerification, User} from "firebase/auth";


export const sendVerificationEmail = async (
  user: User,
  t: any
) => {
  // if (!privateUser?.email) {
  //   toast.error(t('settings.email.no_email', 'No email found on your account.'))
  //   return
  // }
  if (!user) {
    toast.error(t('settings.email.must_sign_in', 'You must be signed in to send a verification email.'))
    return
  }
  toast
    .promise(sendEmailVerification(user), {
      loading: t('settings.email.sending', 'Sending verification email...'),
      success: t('settings.email.verification_sent', 'Verification email sent — check your inbox and spam.'),
      error: t('settings.email.verification_failed', 'Failed to send verification email.'),
    })
    .catch(() => {
      console.error("Failed to send verification email")
    })
}