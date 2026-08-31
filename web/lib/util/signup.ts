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

/**
 * The one path from a social button into an account. Both `/register` and `/signin` go through it.
 *
 * They used not to. `/signin` had its own copy that called the provider and then redirected, and the
 * copy was missing `setOnboardingFlag()` — so signing up with Google or Apple from the sign-in page
 * produced a *different* app state than pressing the identical button one page over. Without the
 * flag, `auth-context.tsx` takes the branch that loads the user from the database, finds nothing
 * (the row does not exist until `/signup` finishes), logs "should redirect to /onboarding" and
 * leaves `useUser()` null. The redirect still happened, so it mostly looked fine; the two entry
 * points simply disagreed about what a half-created account is, which is the sort of difference that
 * only shows up in someone else's bug report.
 *
 * The flag is set *before* the provider sheet opens rather than after it returns: the Firebase
 * listener can fire the moment the credential is exchanged, which is inside `login()`, and a flag set
 * afterwards would be too late to stop that first load attempt.
 *
 * `path` is where to land once an existing account is recognised — `/signin`'s `?redirect=` — and is
 * ignored for a new one, which always goes to onboarding.
 *
 * Throws rather than swallowing, so each page can present the failure the way it already does:
 * a toast on `/register`, the inline `AuthError` on `/signin`. The state handling either side of the
 * failure is what has to match, and now does.
 */
export async function socialSigninSignup(login: () => Promise<any>, path?: string | null) {
  setOnboardingFlag()
  try {
    const creds = await login()
    await signinSignupRedirect(creds?.user?.uid, path)
  } catch (e) {
    // Cleared on the way out, or a failed attempt would leave every later session convinced it is
    // mid-onboarding and stop `auth-context` loading anyone at all.
    clearOnboardingFlag()
    throw e
  }
}

const toastSocialFailure = (e: any) => {
  console.error(e)
  toast.error('Failed to sign in: ' + (e?.message ?? ''))
}

export const googleSigninSignup = async () =>
  socialSigninSignup(googleLogin).catch(toastSocialFailure)

export const appleSigninSignup = async () =>
  socialSigninSignup(appleLogin).catch(toastSocialFailure)

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
