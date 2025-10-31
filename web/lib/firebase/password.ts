import {sendPasswordResetEmail} from "firebase/auth";
import toast from "react-hot-toast";
import {auth} from "web/lib/firebase/users";

export const sendPasswordReset = async (email: string | undefined) => {
  if (!email) {
    toast.error('No email found on your account.')
    return
  }
  toast.promise(
    sendPasswordResetEmail(auth, email),
    {
      loading: 'Sending password reset email...',
      success: 'Password reset email sent — check your inbox and spam.',
      error: 'Failed to send password reset email.',
    }
  )
    .catch((e) => {
      if (e.code === 'auth/user-not-found') {
        toast.error('No account found with that email.')
        return
      }
      console.log("Failed to send password reset email", e)
    })
}