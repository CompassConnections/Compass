'use client'
import {debug} from 'common/logger'
import {PrivateUser, User} from 'common/user'
import {useContext, useEffect, useState} from 'react'
import {AuthContext} from 'web/components/auth-context'
import {getFullUserById, getPrivateUserSafe} from 'web/lib/supabase/users'

import {useApiSubscription} from './use-api-subscription'
import {useIsPageVisible} from './use-page-visible'

export const useUser = () => {
  const authUser = useContext(AuthContext)
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

  useApiSubscription({
    topics: [`user/${userId ?? '_'}`],
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
  }, [userId, isPageVisible])

  return user
}

export const useWebsocketPrivateUser = (userId: string | undefined) => {
  const [privateUser, setPrivateUser] = useState<PrivateUser | null | undefined>()

  useApiSubscription({
    topics: [`private-user/${userId ?? '_'}`],
    onBroadcast: () => {
      getPrivateUserSafe().then((result) => {
        if (result) {
          setPrivateUser(result)
        }
      })
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
