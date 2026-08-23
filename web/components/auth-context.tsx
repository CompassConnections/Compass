'use client'
import {AUTH_COOKIE_NAME} from 'common/envs/constants'
import {debug} from 'common/logger'
import {type PrivateUser, type User, type UserAndPrivateUser} from 'common/user'
import {randomString} from 'common/util/random'
import {onAuthStateChanged, onIdTokenChanged, User as FirebaseUser} from 'firebase/auth'
import {createContext, ReactNode, useEffect, useState} from 'react'
import {useEffectCheckEquality} from 'web/hooks/use-effect-check-equality'
import {useStateCheckEquality} from 'web/hooks/use-state-check-equality'
import {useWebsocketPrivateUser, useWebsocketUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {clearLocalStoragePreservingConsent} from 'web/lib/consent'
import {auth} from 'web/lib/firebase/users'
import {getLocale} from 'web/lib/locale-cookie'
import {identifyUser, setUserProperty} from 'web/lib/service/analytics'
import {getPrivateUserSafe, getUserSafe} from 'web/lib/supabase/users'
import {setCookie} from 'web/lib/util/cookie'
import {safeLocalStorage} from 'web/lib/util/local'
import {isOnboardingFlag} from 'web/lib/util/signup'

// Either we haven't looked up the logged-in user yet (undefined), or we know
// the user is not logged in (null), or we know the user is logged in.
export type AuthUser = undefined | null | (UserAndPrivateUser & {authLoaded: boolean})

export const ensureDeviceToken = () => {
  let deviceToken = safeLocalStorage?.getItem('device-token')
  if (!deviceToken) {
    deviceToken = randomString()
    safeLocalStorage?.setItem('device-token', deviceToken)
  }
  return deviceToken
}

// const getAdminToken = () => {
//   const key = 'TEST_CREATE_USER_KEY'
//   const cookie = getCookie(key)
//   if (cookie) return cookie.replace(/"/g, '')
//
//   // For our convenience. If there's a token in local storage, set it as a cookie
//   const localStorageToken = safeLocalStorage?.getItem(key)
//   if (localStorageToken) {
//     setCookie(key, localStorageToken.replace(/"/g, ''))
//   }
//   return localStorageToken?.replace(/"/g, '') ?? ''
// }

// const stripUserData = (user: object) => {
//   // there's some risk that this cookie could be too big for some clients,
//   // so strip it down to only the keys that the server auth actually needs
//   // in order to auth to the firebase SDK
//   const whitelist = ['uid', 'emailVerified', 'isAnonymous', 'stsTokenManager']
//   const stripped = pickBy(user, (_v, k) => whitelist.includes(k))
//   // mqp: temp fix to get cookie size under 4k in edge cases
//   delete (stripped as any).stsTokenManager.accessToken
//   return JSON.stringify(stripped)
// }
//
// const setUserCookie = (data: object | undefined) => {
//   const stripped = data ? stripUserData(data) : ''
//   setCookie(AUTH_COOKIE_NAME, stripped, [
//     ['path', '/'],
//     ['max-age', (data === undefined ? 0 : TEN_YEARS_SECS).toString()],
//     ['samesite', 'lax'],
//     ['secure'],
//   ])
// }

/**
 * Deletes the legacy `FBUSER_*` auth cookie.
 *
 * That cookie mirrored the Firebase user into a cookie so `getServerSideProps` could hand a
 * pre-resolved `serverUser` to `AuthProvider`. Nothing does that any more — no page sets
 * `pageProps.auth`, and nothing anywhere reads `AUTH_COOKIE_NAME` — so all the cookie did was park
 * `stsTokenManager.refreshToken` in JS-readable storage for ten years. The access token was stripped
 * (see the commented-out `stripUserData` above), but the refresh token is the one that mints new
 * access tokens indefinitely, so any XSS on the page was a durable account takeover.
 *
 * Still *called*, not just deleted, because removing the writer alone would leave the token sitting
 * in every existing browser until 2035. This clears it on the next load for anyone who has one. Safe
 * to drop entirely once the population that visited before this change has cycled through.
 */
export const clearUserCookie = () => {
  setCookie(AUTH_COOKIE_NAME, '', [
    ['path', '/'],
    ['max-age', '0'],
    ['samesite', 'lax'],
    ['secure'],
  ])
}

/**
 * Subscribe to Firebase Auth user updates.
 * Reactively returns the current Firebase `User` and updates when:
 * - auth state changes (sign in/out)
 * - ID token changes (after `getIdToken(true)` or `user.reload()`),
 *   which is important for reflecting `emailVerified` changes without a hard refresh.
 */
function useAndSetupFirebaseUser() {
  const [, forceRender] = useState(0)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser)

  useEffect(() => {
    const update = (u: FirebaseUser | null) => {
      setFirebaseUser(u) // keep the real User instance
      forceRender((v) => v + 1) // force React to re-render
    }

    const unsubAuth = onAuthStateChanged(auth, update)
    const unsubToken = onIdTokenChanged(auth, update)

    return () => {
      unsubAuth()
      unsubToken()
    }
  }, [])

  return firebaseUser
}

export const FirebaseUserContext = createContext<FirebaseUser | null | undefined>(undefined)

export const AuthContext = createContext<AuthUser>(undefined)

// function getSupabaseAuthCall() {
//   return api('get-supabase-token').catch((e) => {
//     console.error('Error getting supabase token', e)
//     return null
//   })
// }

export function AuthProvider(props: {children: ReactNode; serverUser?: AuthUser}) {
  const {children, serverUser} = props

  const [user, setUser] = useStateCheckEquality<User | undefined | null>(
    serverUser ? serverUser.user : serverUser,
  )
  const [privateUser, setPrivateUser] = useStateCheckEquality<PrivateUser | undefined>(
    serverUser ? serverUser.privateUser : undefined,
  )
  const [authLoaded, setAuthLoaded] = useState(false)
  const firebaseUser = useAndSetupFirebaseUser()
  const CACHED_USER_KEY = `CACHED_USER_KEY_V1-${firebaseUser?.uid}`

  const authUser = !user
    ? user
    : !privateUser
      ? privateUser
      : firebaseUser
        ? {user, privateUser, authLoaded}
        : undefined

  // debug({serverUser, user, authUser})

  useEffect(() => {
    if (serverUser === undefined) {
      const cachedUser = safeLocalStorage?.getItem(CACHED_USER_KEY)
      const parsed = cachedUser ? JSON.parse(cachedUser) : undefined
      if (parsed) {
        setUser(parsed.user)
        setPrivateUser(parsed.privateUser)
        setAuthLoaded(false)
      } else setUser(undefined)
    }
  }, [serverUser])

  useEffect(() => {
    if (authUser) {
      // Persist to local storage, to reduce login blink next time.
      // Note: Cap on localStorage size is ~5mb
      safeLocalStorage?.setItem(CACHED_USER_KEY, JSON.stringify(authUser))
    }
  }, [authUser])

  // function updateSupabase() {
  // When testing on a mobile device, we'll be pointed at a local ip or ngrok address, so this will fail
  // Skipping for now as it seems to work fine without it
  // if (supabaseJwt) updateSupabaseAuth(supabaseJwt.jwt)
  // }

  const onAuthLoad = (fbUser: FirebaseUser, user: User, privateUser: PrivateUser) => {
    setUser(user)
    setPrivateUser(privateUser)
    setAuthLoaded(true)
    // generate auth token
    fbUser.getIdToken()
    const locale = getLocale()
    debug('onAuthLoad', locale)
    if (privateUser.locale !== locale) {
      api('update-user-locale', {locale})
    }
  }

  function onAuthLoggedOut() {
    // User logged out; reset to null
    clearUserCookie()
    setUser(null)
    setPrivateUser(undefined)
    // Clear local storage only if we were signed in, otherwise we'll clear referral info
    if (safeLocalStorage?.getItem(CACHED_USER_KEY)) clearLocalStoragePreservingConsent()
  }

  useEffect(() => {
    return onIdTokenChanged(
      auth,
      async (fbUser) => {
        if (fbUser) {
          clearUserCookie()
          if (isOnboardingFlag()) {
            debug(
              'Logged into firebase but onboarding, skipping auth load until onboarding is complete',
            )
            setUser(null)
          } else {
            const [user, privateUser] = await Promise.all([
              getUserSafe(fbUser.uid),
              getPrivateUserSafe(),
              // getSupabaseAuthCall(),
            ])
            // updateSupabase()
            if (user && privateUser) {
              onAuthLoad(fbUser, user, privateUser)
            } else {
              debug('Logged into firebase but user not found in db, should redirect to /onboarding')
              setUser(null)
            }
          }
        } else {
          onAuthLoggedOut()
        }
      },
      (e) => {
        console.error(e)
      },
    )
  }, [])

  const uid = authUser ? authUser.user.id : authUser
  const username = authUser?.user.username

  useEffect(() => {
    if (uid) {
      identifyUser(uid)
    } else if (uid === null) {
      identifyUser(null)
    }
  }, [uid])

  useEffect(() => {
    if (username != null) {
      setUserProperty('username', username)
    }
  }, [username])

  const listenUser = useWebsocketUser(uid ?? undefined)
  useEffectCheckEquality(() => {
    if (authLoaded && listenUser) setUser(listenUser)
  }, [authLoaded, listenUser])

  const listenPrivateUser = useWebsocketPrivateUser(uid ?? undefined)
  useEffectCheckEquality(() => {
    if (authLoaded && listenPrivateUser) setPrivateUser(listenPrivateUser)
  }, [authLoaded, listenPrivateUser])

  return (
    <FirebaseUserContext.Provider value={firebaseUser}>
      <AuthContext.Provider value={authUser}>{children}</AuthContext.Provider>
    </FirebaseUserContext.Provider>
  )
}
