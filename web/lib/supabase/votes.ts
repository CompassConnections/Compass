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

// What the `<head>` of a proposal page needs, read on the server before the page is sent — which
// means it is read as the anon role, since nobody is signed in at that point.
//
// `get_votes_with_results` can't be used here even though it returns a superset: it joins
// `vote_comments` to rank the highlighted arguments, and anon has no grant on that table, so the
// whole call errors rather than coming back without them. The proposal row and the ballots are both
// anon-readable, and the tallies are the same arithmetic the function does.
export const getVoteMeta = async (params: {voteId: number}) => {
  const {voteId} = params
  const [vote, results] = await Promise.all([
    db.from('votes').select('id, title, description, status').eq('id', voteId).limit(1),
    db.from('vote_results').select('choice').eq('vote_id', voteId),
  ])
  if (vote.error) throw vote.error
  if (results.error) throw results.error

  const row = vote.data?.[0]
  if (!row) return null

  const choices = (results.data ?? []).map((r) => r.choice)
  return {
    ...row,
    votes_for: choices.filter((c) => c === 1).length,
    votes_against: choices.filter((c) => c === -1).length,
    votes_abstain: choices.filter((c) => c === 0).length,
  }
}

export type VoteMeta = NonNullable<Awaited<ReturnType<typeof getVoteMeta>>>

// The viewer's own ballot on every proposal, so each card can highlight the button they picked. One
// query for the whole list rather than a per-card lookup — it's a single index scan on `user_id`, and
// the alternative is teaching `get_votes_with_results` about the caller, which it has no way to know
// (the list is fetched with the anon key, not as the signed-in Postgres role).
export const getMyVoteChoices = async (params: {userId: string}) => {
  const {userId} = params
  const {data, error} = await db
    .from('vote_results')
    .select('vote_id, choice')
    .eq('user_id', userId)
  if (error) throw error

  return Object.fromEntries((data ?? []).map((r) => [r.vote_id, r.choice])) as Record<
    number,
    number
  >
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
