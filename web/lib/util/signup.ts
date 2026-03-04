import {debug} from 'common/logger'
import {getProfileRow} from 'common/profiles/profile'
import Router from 'next/router'
import toast from 'react-hot-toast'
import {firebaseLogin} from 'web/lib/firebase/users'
import {db} from 'web/lib/supabase/db'
import {safeLocalStorage} from 'web/lib/util/local'

export function setOnboardingFlag() {
  debug('setOnboardingFlag')
  safeLocalStorage?.setItem(`is-onboarding`, 'true')
}

export function clearOnboardingFlag() {
  debug('clearOnboardingFlag')
  safeLocalStorage?.removeItem(`is-onboarding`)
}

export function isOnboardingFlag() {
  debug('isOnboardingFlag')
  return safeLocalStorage?.getItem(`is-onboarding`)
}

export const googleSigninSignup = async () => {
  try {
    setOnboardingFlag()
    const creds = await firebaseLogin()
    await postSignupRedirect(creds)
  } catch (e: any) {
    console.error(e)
    toast.error('Failed to sign in: ' + e.message)
  }
}

export async function startSignup() {
  await Router.push('/register')
}

export async function postSignupRedirect(creds: any) {
  const userId = creds?.user?.uid
  if (userId) {
    const profile = await getProfileRow(userId, db)
    if (profile) {
      await Router.push('/')
    } else {
      await Router.push('/onboarding')
    }
  }
}
