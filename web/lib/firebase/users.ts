import {type User} from 'common/user'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {getAuth, GoogleAuthProvider, signInWithPopup} from 'firebase/auth'

import {safeLocalStorage} from '../util/local'
import {app} from './init'
import {GOOGLE_CLIENT_ID} from "common/constants";
import {REDIRECT_URI} from "common/envs/constants";
import {isAndroidWebView} from "web/lib/util/webview";

dayjs.extend(utc)

export type {User}

export const auth = getAuth(app)

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
  }
) {
  const local = safeLocalStorage
  const cachedReferralUser = local?.getItem(CACHED_REFERRAL_USERNAME_KEY)
  const {explicitReferrer} = otherOptions || {}

  // Write the first referral username we see.
  if (!cachedReferralUser) {
    local?.setItem(
      CACHED_REFERRAL_USERNAME_KEY,
      explicitReferrer || defaultReferrerUsername
    )
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
 * @public
 */
export async function webviewGoogleSignin() {

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
  });
  console.log('params', params)

  window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, '_system');
}

export async function firebaseLogin() {
  if (isAndroidWebView()) {
    console.log('Running in APK')
    return await webviewGoogleSignin()
  }
  console.log('Running in web')
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider).then(async (result) => {
    return result
  })
}

// export async function loginWithApple() {
//   const provider = new OAuthProvider('apple.com')
//   provider.addScope('email')
//   provider.addScope('name')
//
//   return signInWithPopup(auth, provider)
//     .then((result) => {
//       return result
//     })
//     .catch((error) => {
//       console.error(error)
//     })
// }

export async function firebaseLogout() {
  await auth.signOut()
}
