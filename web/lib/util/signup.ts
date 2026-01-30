import Router from 'next/router'
import {firebaseLogin} from 'web/lib/firebase/users'
import {db} from 'web/lib/supabase/db'
import {getProfileRow} from 'common/profiles/profile'
import toast from "react-hot-toast";

export const signupThenMaybeRedirectToSignup = async () => {
  try {
    const creds = await firebaseLogin()
    const userId = creds?.user.uid
    if (userId) {
      const profile = await getProfileRow(userId, db)
      if (profile) {
        await Router.push('/')
      } else {
        await Router.push('/onboarding')
      }
    }
  } catch (e: any) {
    console.error(e)
    toast.error('Failed to sign in: ' + e.message)
  }
}

export async function signupRedirect() {
  await Router.push('/register')
}
