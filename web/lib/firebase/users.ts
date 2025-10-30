import {type User} from 'common/user'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {getAuth, GoogleAuthProvider, signInWithPopup} from 'firebase/auth'

import {safeLocalStorage} from '../util/local'
import {app} from './init'
import {IS_LOCAL, WEB_URL} from "common/envs/constants";

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

export function isAndroidWebView() {
  try {
    // Detect if Android bridge exists
    return typeof (window as any).AndroidBridge?.isNativeApp === 'function';
  } catch {
    return false;
  }
}

async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  console.log({codeVerifier, codeChallenge})
  return {codeVerifier, codeChallenge};
}

export const WEB_GOOGLE_CLIENT_ID = '253367029065-khkj31qt22l0vc3v754h09vhpg6t33ad.apps.googleusercontent.com'
export const ANDROID_GOOGLE_CLIENT_ID = '253367029065-s9sr5vqgkhc8f7p5s6ti6a4chqsrqgc4.apps.googleusercontent.com'
export const GOOGLE_CLIENT_ID = WEB_GOOGLE_CLIENT_ID

/**
 * Authenticates a Firebase client running a webview APK on Android with Google OAuth.
 *
 * `https://accounts.google.com/o/oauth2/v2/auth?${params}` to get the code (in external browser, as google blocks it in webview)
 * Redirects to `com.compassmeet://auth` (in webview java main activity)
 * 'https://oauth2.googleapis.com/token' to get the ID token (in javascript app)
 * signInWithCredential(auth, credential) to set up firebase user in client (auth.currentUser)
 *
 * @public
 */
export async function webviewGoogleSignin() {
  const {codeVerifier, codeChallenge} = await generatePKCE();
  localStorage.setItem('pkce_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${WEB_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, '_system');
}

// export async function googleNativeLogin() {
//   console.log('Platform:', Capacitor.getPlatform())
//   console.log('URL origin:', window.location.origin)
//
//   await SocialLogin.initialize({
//     google: {
//       webClientId: '253367029065-khkj31qt22l0vc3v754h09vhpg6t33ad.apps.googleusercontent.com',        // Required for Android and Web
//       // iOSClientId: 'YOUR_IOS_CLIENT_ID',        // Required for iOS
//       // iOSServerClientId: 'YOUR_WEB_CLIENT_ID',  // Required for iOS offline mode and server authorization (same as webClientId)
//       mode: 'online',  // 'online' or 'offline'
//     }
//   });
//   console.log('Done initializing SocialLogin')
//
//   // Run the native Google OAuth
//   const result: any = await SocialLogin.login({provider: 'google', options: {}})
//
//   console.log('result', result)
//
//   // Extract the tokens from the native result
//   const idToken = result?.result?.idToken
//   const accessToken = result?.result?.accessToken?.token
//
//   if (!idToken) {
//     throw new Error('No idToken returned from Google login')
//   }
//
//   // Create a Firebase credential from the Google tokens
//   const credential = GoogleAuthProvider.credential(idToken, accessToken)
//
//   // Sign in with Firebase using the credential
//   const userCredential = await signInWithCredential(auth, credential)
//
//   console.log('Firebase user:', userCredential.user)
//
//   return userCredential
// }

// export const isRunningInAPK = () => typeof window !== 'undefined' && (window as any).IS_APK === true

export async function firebaseLogin() {
  if (isAndroidWebView() || IS_LOCAL) {
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
