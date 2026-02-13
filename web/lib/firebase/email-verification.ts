import toast from "react-hot-toast";
import {sendEmailVerification, User} from "firebase/auth";
import {auth} from "web/lib/firebase/users";


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
    .catch((e) => {
      console.error("Failed to send verification email", e)
      if (e?.code === 'auth/too-many-requests') {
        toast.error(t('settings.email.too_many_requests', "You can't request more than one email per minute. Please wait before sending another request."))
      }
      return
    })

  async function waitForEmailVerification(intervalMs = 2000, timeoutMs = 5 * 60 * 1000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const user = auth.currentUser;
      if (!user) return false;

      // Refresh user record from Firebase
      await user.reload();

      if (user.emailVerified) {
        // IMPORTANT: force a new ID token with updated claims
        await user.getIdToken(true);
        toast.success(t('settings.email.verified', 'Email Verified ✔️'))
        return true;
      }

      await new Promise(r => setTimeout(r, intervalMs));
    }

    return false;
  }

  waitForEmailVerification()

}