import {OrderBy} from 'common/votes/constants'
import {db} from 'web/lib/supabase/db'

export const getVotes = async (params: {orderBy: OrderBy}) => {
  const {orderBy} = params
  const {data, error} = await db.rpc('get_votes_with_results' as any, {
    order_by: orderBy,
  })
  if (error) throw error

  return data
}

// Same aggregation as the list, filtered to one proposal — the detail page needs the tallies and the
// comment count, not just the raw `votes` row.
export const getVote = async (params: {voteId: number}) => {
  const {voteId} = params
  const {data, error} = await db.rpc('get_votes_with_results' as any, {
    order_by: 'recent',
    only_vote_id: voteId,
  })
  if (error) throw error

  return data?.[0] ?? null
}

// The author's own recorded vote, shown next to their comments so a reader can see whether an
// argument comes from someone who ended up voting for or against.
export const getVoteResultsByUser = async (params: {voteId: number}) => {
  const {voteId} = params
  const {data, error} = await db
    .from('vote_results')
    .select('user_id, choice')
    .eq('vote_id', voteId)
  if (error) throw error

  return Object.fromEntries((data ?? []).map((r) => [r.user_id, r.choice]))
}
