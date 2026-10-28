import {type Comment} from 'common/comment'
import {keyBy} from 'lodash'
import {useEffect, useMemo, useState} from 'react'

import {useAPIGetter} from './use-api-getter'
import {useApiSubscription} from './use-api-subscription'
import {useIsAuthorized} from './use-user'

/**
 * The comments on a profile, kept current over the websocket.
 *
 * The initial list comes from `get-profile-comments`, which decides what this viewer may see; the
 * subscription then layers on comments created or hidden since. Hidden comments are not returned by
 * the endpoint but can still arrive over the wire (a hide is broadcast as the comment with `hidden`
 * set), which is why the caller still filters on `hidden`.
 */
export function useLiveCommentsOnProfile(userId: string) {
  // Ask only once the auth state is known. The endpoint is open to visitors, but a signed-in member
  // whose token has not been restored yet would be answered as a visitor — empty for a members-only
  // profile — and `useAPIGetter` does not ask twice for the same props.
  const authorized = useIsAuthorized()
  const {data} = useAPIGetter(
    'get-profile-comments',
    authorized === undefined ? undefined : {userId},
  )

  const [live, setLive] = useState<Comment[]>([])
  useEffect(() => setLive([]), [userId])

  useApiSubscription({
    topics: [`user/${userId}/comment`],
    onBroadcast: ({data}) => {
      if (data.comment) {
        const comment = data.comment as Comment
        // Newest version of a comment wins, so a hide broadcast replaces the one we have.
        setLive((live) => [...live.filter((c) => c.id !== comment.id), comment])
      }
    },
  })

  return useMemo(() => {
    const fetched = data?.comments ?? []
    const liveById = keyBy(live, 'id')
    const fetchedIds = new Set(fetched.map((c) => c.id))
    return [
      ...fetched.map((c) => liveById[c.id] ?? c),
      ...live.filter((c) => !fetchedIds.has(c.id)),
    ]
  }, [data, live])
}
