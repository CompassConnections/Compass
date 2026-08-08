import {type VoteComment} from 'common/comment'
import {convertVoteComment} from 'common/supabase/comment'
import {sortBy, uniqBy} from 'lodash'
import {useEffect, useState} from 'react'
import {db} from 'web/lib/supabase/db'

import {useApiSubscription} from './use-api-subscription'

export function useLiveCommentsOnVote(voteId: number | undefined) {
  const [comments, setComments] = useState<VoteComment[]>([])

  useEffect(() => {
    if (voteId === undefined) return
    let cancelled = false
    ;(async () => {
      const data = await getVoteComments(voteId)
      if (data && !cancelled) setComments(data)
    })()
    return () => {
      cancelled = true
    }
  }, [voteId])

  useApiSubscription({
    enabled: voteId !== undefined,
    topics: [`vote/${voteId}/comment`],
    onBroadcast: ({data}) => {
      const incoming = data.comment as VoteComment | undefined
      if (!incoming) return
      // The same id can arrive twice (create, then a hide toggle) — keep the newer payload so a
      // deletion broadcast isn't discarded as a duplicate of the original.
      setComments((prev) => sortBy(uniqBy([incoming, ...prev], 'id'), 'createdTime'))
    },
  })

  return comments
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
