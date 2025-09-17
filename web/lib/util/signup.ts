import Router from 'next/router'
import { firebaseLogin } from 'web/lib/firebase/users'
import { db } from 'web/lib/supabase/db'
import { getProfileRow } from 'common/love/lover'

export const signupThenMaybeRedirectToSignup = async () => {
  const creds = await firebaseLogin()
  await Router.push('/')
  const userId = creds?.user.uid
  if (userId) {
    const lover = await getProfileRow(userId, db)
    if (!lover) {
      await Router.push('/signup')
    }
  }
}

export async function signupRedirect() {
  await Router.push('/register')
}
