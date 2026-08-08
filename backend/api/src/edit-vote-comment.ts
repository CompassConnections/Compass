import {validateCommentAuthor} from 'api/helpers/comment'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {MAX_VOTE_COMMENT_LENGTH} from 'common/comment'
import {convertVoteComment} from 'common/supabase/comment'
import {type Row} from 'common/supabase/utils'
import {richTextToString} from 'common/util/parse'
import {isCommentable} from 'common/votes/constants'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {broadcastUpdatedVoteComment} from 'shared/websockets/helpers'

export const editVoteComment: APIHandler<'edit-vote-comment'> = async (
  {commentId, content: submittedContent},
  auth,
) => {
  const {content} = await validateCommentAuthor(auth.uid, submittedContent)

  const text = richTextToString(content)
  if (text.length > MAX_VOTE_COMMENT_LENGTH + 100) {
    throw APIErrors.badRequest(
      `Comment is too long; keep it under ${MAX_VOTE_COMMENT_LENGTH} characters.`,
    )
  }

  const pg = createSupabaseDirectClient()

  const comment = await pg.oneOrNone<Row<'vote_comments'>>(
    `select * from vote_comments where id = $1`,
    [commentId],
  )
  if (!comment) throw APIErrors.notFound('Comment not found')

  // Authors only — not admins. Rewriting someone else's argument is a different power from hiding
  // it, and the hide already exists for moderation.
  if (comment.user_id !== auth.uid) {
    throw APIErrors.forbidden('You can only edit your own comment')
  }
  if (comment.hidden) throw APIErrors.forbidden('This comment has been deleted')

  const vote = await pg.oneOrNone<Row<'votes'>>(`select status from votes where id = $1`, [
    comment.vote_id,
  ])
  if (!isCommentable(vote?.status)) {
    throw APIErrors.forbidden('This proposal is settled — its discussion is closed')
  }

  // Archive then update, in one transaction: a half-applied edit would either lose a version from
  // the record or claim an edit that never landed, and the record is the whole reason editing is
  // allowed this freely.
  const updated = await pg.tx(async (tx) => {
    await tx.none(`insert into vote_comment_edits (comment_id, content) values ($1, $2)`, [
      commentId,
      comment.content,
    ])
    return await tx.one<Row<'vote_comments'>>(
      `update vote_comments set content = $2, edited_time = now() where id = $1 returning *`,
      [commentId, content],
    )
  })

  broadcastUpdatedVoteComment(convertVoteComment(updated))

  // Deliberately no notification. The original post already told everyone who voted; re-notifying on
  // every edit turns a typo fix into a second interruption, and would make editing a way to bump
  // your own argument back to the top of everyone's inbox.
  return {status: 'success'}
}
