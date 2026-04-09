import {debug} from 'common/logger'
import {getProfileRowWithFrontendSupabase} from 'common/profiles/profile'
import Router from 'next/router'
import toast from 'react-hot-toast'
import {auth, firebaseLogin} from 'web/lib/firebase/users'
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
    await signinSignupRedirect(creds?.user?.uid)
  } catch (e: any) {
    console.error(e)
    toast.error('Failed to sign in: ' + e.message)
    clearOnboardingFlag()
  }
}

export async function startSignup() {
  await Router.push('/register')
}

export async function signinSignupRedirect(
  userId: string | undefined,
  path?: string | null | undefined,
) {
  debug('postSignupRedirect', userId)
  if (userId) {
    const profile = await getProfileRowWithFrontendSupabase(userId, db)
    if (profile) {
      // Account already exists
      clearOnboardingFlag()
      // force refresh of AuthContext to load user and privateUser
      await auth.currentUser?.getIdToken(true)
      await Router.push(path ?? '/')
    } else {
      await Router.push('/onboarding')
    }
  }
}
