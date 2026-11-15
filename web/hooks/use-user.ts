'use client'
import {debug} from 'common/logger'
import {PrivateUser, User} from 'common/user'
import {createContext, useContext, useEffect, useState} from 'react'
import {AuthContext} from 'web/components/auth-context'
import {getFullUserById, getPrivateUserSafe} from 'web/lib/supabase/users'

import {useApiSubscription} from './use-api-subscription'
import {useIsPageVisible} from './use-page-visible'

/**
 * "View as" (docs/profile-visibility.md): inside this provider, `useUser()` answers as the audience
 * being previewed — `null` for a signed-out visitor, a stand-in member otherwise — so the profile
 * components draw exactly what they draw for that reader, with no preview branches of their own.
 *
 * It changes what is *drawn*, never what is fetched as whom: requests still carry the owner's own
 * session. The profile itself is therefore fetched already redacted for the audience (`get-profile`
 * with `viewAs`), and `hidden` names the content that lives outside the profile row — answers and
 * endorsements — which the owner's session would otherwise be shown in full.
 */
export type ViewAsState = {user: User | null; hidden: ReadonlySet<string>}
export const ViewAsContext = createContext<ViewAsState | undefined>(undefined)
export const useViewAs = () => useContext(ViewAsContext)

export const useUser = () => {
  const viewAs = useContext(ViewAsContext)
  const authUser = useContext(AuthContext)
  if (viewAs) return viewAs.user
  return authUser ? authUser.user : authUser
}

export const usePrivateUser = () => {
  const authUser = useContext(AuthContext)
  return authUser ? authUser.privateUser : authUser
}

export const useIsAuthorized = () => {
  const authUser = useContext(AuthContext)
  return authUser?.authLoaded || authUser === null ? !!authUser : undefined
}

export const useWebsocketUser = (userId: string | undefined) => {
  const [user, setUser] = useState<User | null | undefined>()

  const isPageVisible = useIsPageVisible()

  const fetchUser = () => {
    if (userId) {
      getFullUserById(userId)
        .then((result) => {
          setUser(result)
        })
        .catch(() => {
          console.error('Failed to fetch user')
          setUser(null)
        })
    } else {
      setUser(null)
    }
  }

  useApiSubscription({
    topics: [`user/${userId ?? '_'}`],
    onReconnect: fetchUser,
    onBroadcast: ({data}) => {
      debug('User broadcast', {data})
      setUser((user) => {
        if (!user || !data.user) {
          return user
        } else {
          return {
            ...user,
            ...(data.user as Partial<User>),
          }
        }
      })
    },
  })

  useEffect(() => {
    if (!isPageVisible) return

    fetchUser()
  }, [userId, isPageVisible])

  return user
}

export const useWebsocketPrivateUser = (userId: string | undefined) => {
  const [privateUser, setPrivateUser] = useState<PrivateUser | null | undefined>()

  const refetch = () => {
    getPrivateUserSafe().then((result) => {
      if (result) {
        setPrivateUser(result)
      }
    })
  }

  useApiSubscription({
    topics: [`private-user/${userId ?? '_'}`],
    onBroadcast: refetch,
    onReconnect: () => {
      if (userId) refetch()
    },
  })

  useEffect(() => {
    if (userId) {
      getPrivateUserSafe().then((result) => setPrivateUser(result))
    } else {
      setPrivateUser(null)
    }
  }, [userId])
  return privateUser
}

/**
 * Whether `otherUserId` is blocked, in either direction — you blocked them, or they blocked you.
 *
 * Symmetric on purpose. A one-directional check would let the person who did the blocking carry on
 * seeing and contacting the person they blocked, which is not what the button promises ("You'll no
 * longer see content from this user"), and would leave the blocked party visible to their blocker
 * while the reverse was hidden.
 *
 * This is the display-layer check only. The authoritative enforcement is server-side — see
 * `backend/api/src/helpers/blocks.ts` — because `blockedByUserIds` is a denormalised mirror and a
 * client can simply not call this.
 */
export const isBlocked = (privateUser: PrivateUser | null | undefined, otherUserId: string) =>
  !!privateUser &&
  ((privateUser.blockedUserIds ?? []).includes(otherUserId) ||
    (privateUser.blockedByUserIds ?? []).includes(otherUserId))

/** The full set of ids to hide from lists, for filtering comments and other embedded user content. */
export const blockedUserIdSet = (privateUser: PrivateUser | null | undefined) =>
  new Set([...(privateUser?.blockedUserIds ?? []), ...(privateUser?.blockedByUserIds ?? [])])
