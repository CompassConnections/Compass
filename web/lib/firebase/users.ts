import {Capacitor} from '@capacitor/core'
import {SocialLogin} from '@capgo/capacitor-social-login'
import * as Sentry from '@sentry/nextjs'
import {
  GOOGLE_CLIENT_ID,
  HAS_APPLE_SERVICES_ID,
  HAS_IOS_GOOGLE_CLIENT_ID,
  IOS_GOOGLE_CLIENT_ID,
} from 'common/constants'
import {IS_FIREBASE_EMULATOR} from 'common/envs/constants'
import {debug} from 'common/logger'
import {type User} from 'common/user'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  revokeAccessToken,
  signInWithCredential,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import {isIosApp, isNativeApp} from 'web/lib/util/webview'

import {safeLocalStorage} from '../util/local'
import {app} from './init'

dayjs.extend(utc)

export type {User}

/**
 * `getAuth()` installs Firebase's default popup/redirect resolver, which loads
 * `apis.google.com/js/api.js` and builds a gapi iframe as soon as auth initialises. gapi cannot parse
 * a non-http origin, so inside the iOS shell — served from `capacitor://localhost` — it throws
 * `undefined is not an object (evaluating 'gapi.iframes.getContext')` and takes auth initialisation
 * down with it. `onIdTokenChanged` then never fires, `useUser()` stays `undefined` forever, and
 * `pages/index.tsx` renders its loading animation for good. Nothing logs a failure the app can see.
 *
 * `initializeAuth` with no `popupRedirectResolver` skips that machinery entirely. The native shells
 * never need it: Google and Apple sign-in both go through `@capgo/capacitor-social-login` and
 * `signInWithCredential`. The browser keeps `getAuth`, where `signInWithPopup` is the whole point.
 *
 * Android happens to work either way — Capacitor serves it from `https://localhost`, which gapi
 * accepts. iOS cannot copy that: the scheme has to stay `capacitor://` for `getUserMedia` (voice
 * auto-fill) and `crypto.subtle` (the Sign-in-with-Apple nonce) to see a secure context.
 */
export const auth = isNativeApp()
  ? initializeAuth(app, {persistence: indexedDBLocalPersistence})
  : getAuth(app)

if (IS_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true})
}

// debug('auth:', auth.config)

export const CACHED_REFERRAL_USERNAME_KEY = 'CACHED_REFERRAL_KEY'

// Scenarios:
// 1. User is referred by another user to homepage, group page, market page etc. explicitly via referrer= query param
// 2. User lands on a market or group without a referrer, we attribute the market/group creator
// Explicit referrers take priority over the implicit ones, (e.g. they're overwritten)
export function writeReferralInfo(
  defaultReferrerUsername: string,
  otherOptions?: {
    contractId?: string
    explicitReferrer?: string
  },
) {
  const local = safeLocalStorage
  const cachedReferralUser = local?.getItem(CACHED_REFERRAL_USERNAME_KEY)
  const {explicitReferrer} = otherOptions || {}

  // Write the first referral username we see.
  if (!cachedReferralUser) {
    local?.setItem(CACHED_REFERRAL_USERNAME_KEY, explicitReferrer || defaultReferrerUsername)
  }

  // Overwrite all referral info if we see an explicit referrer.
  if (explicitReferrer) {
    local?.setItem(CACHED_REFERRAL_USERNAME_KEY, explicitReferrer)
  }
}

/**
 * Authenticates a Firebase client running a webview APK on Android with Google OAuth.
 *
 * Calls `https://accounts.google.com/o/oauth2/v2/auth?${params}` to get the code (in external browser, as Google blocks it in webview)
 * Redirects to `com.compassmeet://auth` (in webview java main activity), which triggers oauthRedirect in the app (see _app.tsx)
 * Calls backend endpoint `https://api.compassmeet.com/auth-google` to get the tokens from the code ('https://oauth2.googleapis.com/token')
 * Uses signInWithCredential(auth, credential) to set up firebase user in the client (auth.currentUser)
 *
 * Deprecated for SocialLogin with capacitor, which is native and faster
 *
 * @public
 */
// export async function webviewGoogleSignin() {
//   const params = {
//     client_id: GOOGLE_CLIENT_ID,
//     redirect_uri: REDIRECT_URI,
//     response_type: 'code',
//     scope: 'openid email profile',
//   }
//   console.log('params', params)
//   window.open(`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(params)}`, '_system')
// }

/**
 * Authenticates a Firebase client running a webview APK on Android with native Google OAuth.
 *
 * @public
 */
export async function googleNativeLogin() {
  debug('Platform:', Capacitor.getPlatform())
  debug('URL origin:', window.location.origin)

  await SocialLogin.initialize({
    google: {
      // Firebase verifies the resulting idToken against the *web* client, on both platforms, so
      // webClientId is what makes signInWithCredential accept it. iOSClientId is the separate
      // native client the iOS Google SDK signs in with — required on iOS, ignored on Android.
      webClientId: GOOGLE_CLIENT_ID,
      ...(HAS_IOS_GOOGLE_CLIENT_ID ? {iOSClientId: IOS_GOOGLE_CLIENT_ID} : {}),
    },
  })

  // Run the native Google OAuth.
  //
  // `forcePrompt` is what makes the account chooser appear. Without it `GoogleProvider.swift:80` takes
  // the `hasPreviousSignIn()` branch and calls `restorePreviousSignIn` — silently returning whichever
  // Google account was used last, with no sheet and no way to pick another. Anyone with two Google
  // accounts is therefore permanently stuck on the first one they ever used here, and the only visible
  // symptom is a button that appears to do nothing before logging you straight in.
  //
  // The cost is one extra tap for a single-account user, which is the same bargain Google's own web
  // flow makes and is worth it to have account switching work at all.
  const {result}: any = await SocialLogin.login({
    provider: 'google',
    options: {forcePrompt: true},
  })

  debug('SocialLogin.login result:', JSON.stringify(result))

  // Extract the tokens from the native result
  const idToken = result?.idToken
  const accessToken = result?.accessToken?.token

  if (!idToken) {
    throw new Error('No idToken returned from Google login')
  }

  // Create a Firebase credential from the Google tokens
  const credential = GoogleAuthProvider.credential(idToken, accessToken)

  // Sign in with Firebase using the credential
  const userCredential = await signInWithCredential(auth, credential)

  debug('Firebase user:', userCredential.user)

  return userCredential
}

/**
 * Random string used as the Sign-in-with-Apple nonce, plus its SHA-256.
 *
 * Apple embeds whatever nonce the request carries verbatim into the identity token, and Firebase
 * compares that claim against `SHA256(rawNonce)` — so the request has to get the *hash* and Firebase
 * the *raw* value. `crypto.subtle` needs a secure context, which `capacitor://localhost` is but the
 * cleartext dev-server mode is not; when it is unavailable we sign in without a nonce at all, which
 * Apple and Firebase both accept (the token then simply carries no nonce claim to bind).
 */
async function appleNonce() {
  const raw = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    debug('No crypto.subtle — Apple sign-in without a nonce')
    return {raw: undefined, hashed: undefined}
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return {raw, hashed}
}

/**
 * Native Sign in with Apple, required by App Store guideline 4.8 for any app offering third-party
 * social login. iOS only — on Android and the web, Google is the only social provider.
 *
 * Apple returns the user's name *only on the very first authorization*, and never again, so it has
 * to be persisted onto the Firebase user right here; `web/pages/signup.tsx` reads `displayName` when
 * seeding the profile. Emails may be `…@privaterelay.appleid.com` — real, forwarding addresses that
 * must be treated like any other.
 */
/**
 * Runs one leg of the Apple flow, and makes a failure say *which* leg failed and why.
 *
 * Written after App Review rejected 1.42.0 under guideline 2.1 with nothing more than "got an error
 * when trying to login with Apple login". That report is unactionable, and it was unactionable
 * because the app threw it away: `/signin` caught whatever came back and rendered the fixed string
 * "Failed to sign in with Apple", so the screenshot a reviewer could have attached would have said
 * no more than their sentence did.
 *
 * The three legs fail for entirely different reasons and are worth telling apart. `initialize` and
 * `login` are the native side — an `ASAuthorizationError` here is almost always the provisioning
 * profile rather than the code, since the Sign in with Apple capability has to be on the App ID and
 * in the *distribution* profile, and a development build will happily work while the store build
 * does not. `credential` is Firebase, where the codes are self-explaining
 * (`auth/operation-not-allowed` = provider off, `auth/invalid-credential` = the nonce did not match,
 * `auth/account-exists-with-different-credential` = the address is already a Google account).
 *
 * The stage and code go into the thrown message deliberately: it is what the person sees, so a
 * screenshot from a reviewer or a member is finally worth something. Sentry gets the original.
 */
/**
 * Whether a failed sign-in is just someone closing the sheet.
 *
 * Backing out is not an error and must not be shown as one — which is what App Review most likely saw
 * when they reported "got an error when trying to login with Apple login". Opening the Apple sheet and
 * dismissing it left the fixed failure string on screen, which reads as a broken button rather than as
 * a cancelled action.
 *
 * The awkward part is `1000`. Apple documents `.canceled` as 1001, but dismissing the sheet reports
 * `AuthorizationError error 1000` — `.unknown`, the catch-all — so treating only 1001 as a
 * cancellation catches almost nothing in practice. 1000 is therefore included, and the cost is
 * acknowledged: a *genuine* unknown failure now also passes quietly. That trade is deliberate. A
 * person who backed out deserves silence, and the diagnostics are not lost — see below, these still
 * reach Sentry, just as a breadcrumb rather than as an exception.
 *
 * Google's side is matched on wording rather than a code: `GIDSignIn` and AppAuth both say "cancel",
 * and AppAuth spells it with one `l` while the Firebase web codes use two.
 */
export function isSignInCancellation(e: any): boolean {
  const text = `${e?.code ?? ''} ${e?.errorMessage ?? ''} ${e?.message ?? ''}`
  return (
    /AuthorizationError error (1000|1001)/.test(text) ||
    /cancell?ed/i.test(text) ||
    e?.code === 'auth/popup-closed-by-user' ||
    e?.code === 'auth/cancelled-popup-request'
  )
}

async function appleStep<T>(stage: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (e: any) {
    // `code` is Firebase's; `errorMessage` is what the Capacitor bridge puts a rejected native call
    // under. Neither is always present, hence the walk down to `message`.
    const code = e?.code ?? e?.errorMessage ?? e?.message ?? 'unknown error'
    const cancelled = isSignInCancellation(e)
    debug('Apple sign-in failed at', stage, e)

    if (cancelled) {
      // A breadcrumb rather than an exception: closing a sheet is not something to page anyone about,
      // but because `1000` is ambiguous this is also the only trace a real failure would leave. It
      // rides along on whatever the session reports next.
      Sentry.addBreadcrumb({
        category: 'auth',
        level: 'info',
        message: `Apple sign-in dismissed at ${stage}: ${code}`,
      })
    } else {
      Sentry.captureException(e, {
        tags: {flow: 'apple-signin', stage, platform: Capacitor.getPlatform()},
      })
    }

    const error: any = new Error(`Apple sign-in failed at ${stage}: ${code}`)
    error.code = e?.code
    error.cause = e
    throw error
  }
}

export async function appleNativeLogin() {
  debug('Platform:', Capacitor.getPlatform())

  await appleStep('initialize', () => SocialLogin.initialize({apple: {redirectUrl: ''}}))

  const {raw, hashed} = await appleNonce()
  // Worth having in the breadcrumbs: a build where `crypto.subtle` turned out to be unavailable takes
  // the no-nonce path, and that changes which Firebase errors are possible downstream.
  debug('Apple nonce:', hashed ? 'hashed' : 'none')

  const {result}: any = await appleStep('login', () =>
    SocialLogin.login({
      provider: 'apple',
      options: {scopes: ['name', 'email'], ...(hashed ? {nonce: hashed} : {})},
    }),
  )

  const idToken = result?.idToken
  if (!idToken) {
    throw new Error('No idToken returned from Apple login')
  }

  const credential = new OAuthProvider('apple.com').credential({
    idToken,
    ...(raw ? {rawNonce: raw} : {}),
  })

  const userCredential = await appleStep('credential', () => signInWithCredential(auth, credential))

  const {givenName, familyName} = result?.profile ?? {}
  const fullName = [givenName, familyName].filter(Boolean).join(' ')
  if (fullName && !userCredential.user.displayName) {
    await updateProfile(userCredential.user, {displayName: fullName}).catch((e) =>
      console.error('Failed saving Apple display name', e),
    )
  }

  debug('Firebase user:', userCredential.user)

  return userCredential
}

/** Whether the Apple button should be offered — iOS app only. */
/**
 * Sign in with Apple in a browser, via Firebase's OAuth handler rather than the native SDK.
 *
 * This exists so that an account created with Apple inside the iOS app is not locked to that app.
 * Such a user has `apple.com` as their only provider and often a private-relay address, so without
 * this they could never sign in on desktop and password reset could not help them.
 *
 * Requires the Apple **Services ID** to be configured in Firebase (see `APPLE_SERVICES_ID`) — the
 * App ID that the native flow uses is not enough. Until then `canAppleLogin()` keeps the button
 * hidden in browsers.
 *
 * The name-on-first-authorization quirk applies here exactly as in `appleNativeLogin`, but Firebase
 * populates `displayName` from Apple's response itself on the web, so there is nothing to persist by
 * hand — `web/pages/signup.tsx` reads `auth.currentUser?.displayName` and finds it already set.
 */
export async function appleWebLogin() {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')

  const userCredential = await signInWithPopup(auth, provider)
  debug('Firebase user:', userCredential.user)
  return userCredential
}

/** Native flow inside the iOS app, popup flow everywhere else. */
export async function appleLogin() {
  return isIosApp() ? appleNativeLogin() : appleWebLogin()
}

/**
 * Whether the Apple button should be offered.
 *
 * - iOS app: always. Guideline 4.8 requires it, and the native SDK is available.
 * - Browser: only once the Services ID is configured, otherwise the popup dead-ends in
 *   `auth/operation-not-allowed`.
 * - Android app: not yet. Apple blocks its authorization page inside an embedded WebView, so this
 *   needs the native plugin path rather than `signInWithPopup` — see `docs/ios.md` §5.3.
 */
export function canAppleLogin() {
  if (isIosApp()) return true
  if (isNativeApp()) return false
  return HAS_APPLE_SERVICES_ID
}

export async function googleLogin() {
  if (isNativeApp()) {
    debug('Running in the native app')
    return await googleNativeLogin()
  }
  debug('Running in web')
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider).then(async (result) => {
    return result
  })
}

export const APPLE_PROVIDER_ID = 'apple.com'

/** Whether the signed-in user can authenticate with Apple, i.e. whether there is a token to revoke. */
export function hasAppleProvider() {
  return auth.currentUser?.providerData.some((p) => p.providerId === APPLE_PROVIDER_ID) ?? false
}

/**
 * Revoke the user's Apple refresh token. Called immediately before `me/delete`.
 *
 * Apple requires an app offering Sign in with Apple to revoke the token when the account is deleted,
 * not merely to delete its own rows — it is checked under the same 5.1.1(v) review as the deletion
 * flow itself. Firebase can only revoke a token it captured, which is why the **OAuth code flow
 * configuration** (Team ID, Key ID, Sign in with Apple `.p8`) has to be filled in before anyone signs
 * in; see `docs/ios.md` §5.2.
 *
 * `revokeAccessToken` needs a *fresh* credential, so this re-authenticates first — the person sees one
 * more Apple sheet on the way out. That is Apple's design, not ours.
 *
 * **Best-effort by design.** A failure here is logged and swallowed rather than aborting the
 * deletion: 5.1.1(v) requires that deleting the account actually works, so trapping someone in an
 * undeletable account because Apple was unreachable would break the more important half of the same
 * guideline.
 */
export async function revokeAppleToken(): Promise<'revoked' | 'not-applicable' | 'failed'> {
  const user = auth.currentUser
  if (!user || !hasAppleProvider()) return 'not-applicable'

  try {
    let accessToken: string | null | undefined

    if (isIosApp()) {
      await SocialLogin.initialize({apple: {redirectUrl: ''}})
      const {raw, hashed} = await appleNonce()
      const {result}: any = await SocialLogin.login({
        provider: 'apple',
        options: {scopes: ['name', 'email'], ...(hashed ? {nonce: hashed} : {})},
      })
      if (!result?.idToken) return 'failed'
      const credential = new OAuthProvider(APPLE_PROVIDER_ID).credential({
        idToken: result.idToken,
        ...(raw ? {rawNonce: raw} : {}),
      })
      const reauthed = await reauthenticateWithCredential(user, credential)
      accessToken = OAuthProvider.credentialFromResult(reauthed)?.accessToken
    } else {
      const provider = new OAuthProvider(APPLE_PROVIDER_ID)
      provider.addScope('email')
      provider.addScope('name')
      const reauthed = await reauthenticateWithPopup(user, provider)
      accessToken = OAuthProvider.credentialFromResult(reauthed)?.accessToken
    }

    if (!accessToken) {
      debug('Apple re-auth returned no access token; nothing to revoke')
      return 'failed'
    }

    await revokeAccessToken(auth, accessToken)
    debug('Revoked Apple token')
    return 'revoked'
  } catch (e) {
    console.error('Failed to revoke Apple token before deletion', e)
    return 'failed'
  }
}

/**
 * Signing out of Firebase does not sign you out of the *native* providers, and until it did, "sign
 * out" was only half true on iOS and Android: `GIDSignIn` kept its session, so the next tap on
 * "Sign in with Google" silently restored the same account. Combined with `restorePreviousSignIn`
 * (see `googleNativeLogin`) that made switching accounts impossible without deleting the app.
 *
 * Both provider logouts are best-effort. `SocialLogin.logout` rejects when the provider was never
 * initialised this session, or — for Apple — with "Not logged in; Cannot logout" when there is no
 * stored token, and neither is a reason to leave someone half signed out.
 */
export async function firebaseLogout() {
  if (isNativeApp()) {
    await Promise.all([
      SocialLogin.logout({provider: 'google'}).catch((e) => debug('Google logout skipped', e)),
      SocialLogin.logout({provider: 'apple'}).catch((e) => debug('Apple logout skipped', e)),
    ])
  }
  await auth.signOut()
}
