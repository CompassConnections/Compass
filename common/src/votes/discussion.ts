import {type VoteComment} from 'common/comment'
import {groupBy, orderBy} from 'lodash'

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
