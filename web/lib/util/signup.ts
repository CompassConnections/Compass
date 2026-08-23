import {debug} from 'common/logger'
import {getProfileRowWithFrontendSupabase} from 'common/profiles/profile'
import Router from 'next/router'
import toast from 'react-hot-toast'
import {appleLogin, auth, googleLogin} from 'web/lib/firebase/users'
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

const socialSigninSignup = async (login: () => Promise<any>) => {
  try {
    setOnboardingFlag()
    const creds = await login()
    await signinSignupRedirect(creds?.user?.uid)
  } catch (e: any) {
    console.error(e)
    toast.error('Failed to sign in: ' + e.message)
    clearOnboardingFlag()
  }
}

export const googleSigninSignup = async () => socialSigninSignup(googleLogin)

export const appleSigninSignup = async () => socialSigninSignup(appleLogin)

export async function startSignup() {
  await Router.push('/register')
}

/**
 * Send a logged-out user to `/signin` rather than straight into a provider popup.
 *
 * The inline "sign in to continue" prompts (comment boxes, message buttons) used to call
 * `firebaseLogin()` directly, which is Google-only on every platform. That is fine while Google is the
 * only social provider, and broken as soon as it is not: someone whose account was created with Apple
 * — in the iOS app, likely with a `@privaterelay.appleid.com` address — would be offered Google, and
 * signing in there either creates a second, unrelated account or fails outright with
 * `auth/account-exists-with-different-credential`.
 *
 * `/signin` offers every provider the platform supports (see `canAppleLogin`) plus email, and carries
 * `?redirect=` so the person lands back where they were.
 */
export async function promptSignIn() {
  const from = Router.asPath
  await Router.push(
    from && from !== '/' ? `/signin?redirect=${encodeURIComponent(from)}` : '/signin',
  )
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
