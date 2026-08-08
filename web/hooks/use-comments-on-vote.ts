import {type VoteComment} from 'common/comment'
import {convertVoteComment} from 'common/supabase/comment'
import {sortBy, uniqBy} from 'lodash'
import {useEffect, useState} from 'react'
import {db} from 'web/lib/supabase/db'

import {useApiSubscription} from './use-api-subscription'
import {useEvent} from './use-event'

/**
 * @param onComment fired when a comment arrives over the websocket. The proposal page uses it to
 *   refetch the proposal, because the highlighted pair is ranked in SQL now — without this the
 *   thread would update live while the two comments pinned above it went stale.
 */
export function useLiveCommentsOnVote(voteId: number | undefined, onComment?: () => void) {
  const [comments, setComments] = useState<VoteComment[]>([])

  // Merged into what's already there rather than replacing it. The initial fetch and the websocket
  // race: post a comment before the first fetch resolves and the broadcast arrives first, so a
  // replacing `setComments(data)` would overwrite it with the pre-comment snapshot — the comment
  // vanished until a page reload, but only ever the first one, because later fetches had settled.
  const merge = useEvent((incoming: VoteComment[]) =>
    setComments((prev) => sortBy(uniqBy([...incoming, ...prev], 'id'), 'createdTime')),
  )

  const refresh = useEvent(async () => {
    if (voteId === undefined) return
    const data = await getVoteComments(voteId)
    if (data) merge(data)
  })

  useEffect(() => {
    refresh()
  }, [voteId])

  useApiSubscription({
    enabled: voteId !== undefined,
    topics: [`vote/${voteId}/comment`],
    onBroadcast: ({data}) => {
      const incoming = data.comment as VoteComment | undefined
      if (!incoming) return
      // The same id can arrive twice (create, then a hide toggle) — keep the newer payload so a
      // deletion broadcast isn't discarded as a duplicate of the original.
      merge([incoming])
      onComment?.()
    },
  })

  return {comments, refresh}
}

const getVoteComments = async (voteId: number) => {
  const {data, error} = await db
    .from('vote_comments')
    .select('*')
    .eq('vote_id', voteId)
    .order('created_time', {ascending: true})
  if (error) {
    console.error(error)
    return null
  }
  return data.map(convertVoteComment)
}
