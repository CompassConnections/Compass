import {type VoteComment} from 'common/comment'
import {convertVoteComment} from 'common/supabase/comment'
import {OrderBy, type Stance} from 'common/votes/constants'
import {buildThreads, pickHighlightedArguments} from 'common/votes/discussion'
import {groupBy, keyBy, mapValues} from 'lodash'
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

export type TopArguments = Partial<Record<Stance, VoteComment>>

/**
 * The highlighted argument on each side for every proposal on the list, so a card can show what the
 * discussion actually raised rather than only how many comments it has.
 *
 * Deliberately fetches the comments and ranks them with the same `pickHighlightedArguments` the
 * detail page uses, instead of pushing the ranking into `get_votes_with_results`. Two
 * implementations would drift, and the list highlighting one argument while the proposal page
 * highlights another is worse than the extra round trip. Revisit if proposals ever carry enough
 * comments that pulling their bodies for one screen of cards stops being cheap.
 */
export const getTopArgumentsForVotes = async (params: {voteIds: number[]}) => {
  const {voteIds} = params
  if (!voteIds.length) return {} as Record<number, TopArguments>

  const {data, error} = await db
    .from('vote_comments')
    .select('*')
    .in('vote_id', voteIds)
    .eq('hidden', false)
  if (error) throw error

  const byVote = groupBy((data ?? []).map(convertVoteComment), (c) => c.voteId)
  return mapValues(byVote, (comments) =>
    keyBy(pickHighlightedArguments(buildThreads(comments)), (c) => c.stance!),
  ) as Record<number, TopArguments>
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
