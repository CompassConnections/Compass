import {type VoteComment} from 'common/comment'
import {groupBy, orderBy} from 'lodash'

import {OPPOSING_STANCES, type Stance} from './constants'

export type CommentThread = {
  parent: VoteComment
  replies: VoteComment[]
}

/**
 * Splits a flat comment list into one-level threads. Replies are keyed by their parent id; the
 * backend already collapses reply-to-a-reply onto the top-level parent, so anything whose parent is
 * missing (hidden, deleted) is promoted rather than dropped — losing a reply because its parent went
 * away would silently delete someone's argument.
 */
export const buildThreads = (comments: VoteComment[]): CommentThread[] => {
  const byId = new Set(comments.map((c) => c.id))
  const parents = comments.filter((c) => !c.replyToCommentId || !byId.has(c.replyToCommentId))
  const replies = groupBy(
    comments.filter((c) => c.replyToCommentId && byId.has(c.replyToCommentId)),
    (c) => c.replyToCommentId,
  )

  return orderBy(parents, 'createdTime', 'asc').map((parent) => ({
    parent,
    replies: orderBy(replies[parent.id] ?? [], 'createdTime', 'asc'),
  }))
}

/**
 * One argument from each side to lift to the top of the page.
 *
 * Picked by reply count, tie-broken by age — engagement, not quality. Surfaced as "highlighted"
 * rather than "strongest" for exactly that reason: drawing replies means a comment got attention,
 * which is not the same as being right, and the label shouldn't claim more than the ranking earns.
 * The alternative — plain chronological order — reliably buries the counter-argument under whoever
 * posted first, which is the failure this feature exists to fix. If per-comment voting ever lands,
 * that becomes the better signal.
 */
export const pickHighlightedArguments = (threads: CommentThread[]): VoteComment[] => {
  const best = (stance: Stance) =>
    orderBy(
      threads.filter((t) => t.parent.stance === stance),
      [(t) => t.replies.length, (t) => t.parent.createdTime],
      ['desc', 'asc'],
    )[0]?.parent

  return OPPOSING_STANCES.map(best).filter((c): c is VoteComment => !!c)
}
