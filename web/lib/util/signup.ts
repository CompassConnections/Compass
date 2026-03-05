import {debug} from 'common/logger'
import {getProfileRowWithFrontendSupabase} from 'common/profiles/profile'
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
    await postSignupRedirect(creds?.user?.uid)
  } catch (e: any) {
    console.error(e)
    toast.error('Failed to sign in: ' + e.message)
  }
}

export async function startSignup() {
  await Router.push('/register')
}

export async function postSignupRedirect(userId: string | undefined) {
  if (userId) {
    const profile = await getProfileRowWithFrontendSupabase(userId, db)
    if (profile) {
      // Account already exists
      await Router.push('/')
    } else {
      await Router.push('/onboarding')
    }
  }
}
