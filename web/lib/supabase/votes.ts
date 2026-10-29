import {OrderBy} from 'common/votes/constants'
import {api} from 'web/lib/api'
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

// What the `<head>` of a proposal page needs, read on the server before the page is sent — which
// means it is read as the anon role, since nobody is signed in at that point. Same function as the
// page itself; it is security definer, so the anon role can call it without reading the tables.
export const getVoteMeta = async (params: {voteId: number}) => {
  const vote = await getVote(params)
  if (!vote) return null

  const {id, title, description, status, votes_for, votes_against, votes_abstain} = vote as any
  return {id, title, description, status, votes_for, votes_against, votes_abstain} as {
    id: number
    title: string
    description: any
    status: string | null
    votes_for: number
    votes_against: number
    votes_abstain: number
  }
}

export type VoteMeta = NonNullable<Awaited<ReturnType<typeof getVoteMeta>>>

// The viewer's own ballot on every proposal, so each card can highlight the button they picked. One
// call for the whole list rather than a per-card lookup. Ballots are private, so this goes through
// the API as the caller; `userId` only keys the cache, so signing in as someone else refetches.
export const getMyVoteChoices = async (_params: {userId: string}) => {
  const {choices} = await api('get-my-vote-choices', {})
  return choices
}

// The recorded vote of each member who commented on the proposal, shown next to their comments so a
// reader can see whether an argument comes from someone who ended up voting for or against. Only
// commenters: they argued in public under their name. Everyone else's ballot stays private.
export const getVoteResultsByUser = async (params: {voteId: number}) => {
  const {voteId} = params
  const {data, error} = await db.rpc('get_vote_commenter_choices' as any, {vid: voteId})
  if (error) throw error

  return Object.fromEntries(((data ?? []) as any[]).map((r) => [r.user_id, r.choice]))
}
