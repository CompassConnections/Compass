'use client'
import {AUTH_COOKIE_NAME, TEN_YEARS_SECS} from 'common/envs/constants'
import {debug} from 'common/logger'
import {type PrivateUser, type User, type UserAndPrivateUser} from 'common/user'
import {randomString} from 'common/util/random'
import {onAuthStateChanged, onIdTokenChanged, User as FirebaseUser} from 'firebase/auth'
import {pickBy} from 'lodash'
import {createContext, ReactNode, useEffect, useState} from 'react'
import {useEffectCheckEquality} from 'web/hooks/use-effect-check-equality'
import {useStateCheckEquality} from 'web/hooks/use-state-check-equality'
import {useWebsocketPrivateUser, useWebsocketUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
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
const CACHED_USER_KEY = 'CACHED_USER_KEY_V2'

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

const stripUserData = (user: object) => {
  // there's some risk that this cookie could be too big for some clients,
  // so strip it down to only the keys that the server auth actually needs
  // in order to auth to the firebase SDK
  const whitelist = ['uid', 'emailVerified', 'isAnonymous', 'stsTokenManager']
  const stripped = pickBy(user, (_v, k) => whitelist.includes(k))
  // mqp: temp fix to get cookie size under 4k in edge cases
  delete (stripped as any).stsTokenManager.accessToken
  return JSON.stringify(stripped)
}

const setUserCookie = (data: object | undefined) => {
  const stripped = data ? stripUserData(data) : ''
  setCookie(AUTH_COOKIE_NAME, stripped, [
    ['path', '/'],
    ['max-age', (data === undefined ? 0 : TEN_YEARS_SECS).toString()],
    ['samesite', 'lax'],
    ['secure'],
  ])
}

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

  const authUser = !user
    ? user
    : !privateUser
      ? privateUser
      : firebaseUser
        ? {user, privateUser, authLoaded}
        : undefined

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
    } else if (authUser === null) {
      safeLocalStorage?.removeItem(CACHED_USER_KEY)
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
    setUserCookie(undefined)
    setUser(null)
    setPrivateUser(undefined)
    // Clear local storage only if we were signed in, otherwise we'll clear referral info
    if (safeLocalStorage?.getItem(CACHED_USER_KEY)) localStorage.clear()
  }

  useEffect(() => {
    return onIdTokenChanged(
      auth,
      async (fbUser) => {
        if (fbUser) {
          setUserCookie(fbUser.toJSON())
          if (isOnboardingFlag()) {
            debug(
              'Logged into firebase but onboarding, skipping auth load until onboarding is complete',
            )
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
