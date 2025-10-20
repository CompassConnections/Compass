import Router from 'next/router'
import { firebaseLogin } from 'web/lib/firebase/users'
import { db } from 'web/lib/supabase/db'
import { getProfileRow } from 'common/profiles/profile'

export const signupThenMaybeRedirectToSignup = async () => {
  const creds = await firebaseLogin()
  const userId = creds?.user.uid
  if (userId) {
    const profile = await getProfileRow(userId, db)
    if (profile) {
      await Router.push('/')
    } else {
      await Router.push('/signup')
    }
  }
}

export async function signupRedirect() {
  await Router.push('/register')
}
