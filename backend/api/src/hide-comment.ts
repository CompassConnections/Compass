import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {convertComment, convertVoteComment} from 'common/supabase/comment'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {broadcastUpdatedComment, broadcastUpdatedVoteComment} from 'shared/websockets/helpers'

export const hideComment: APIHandler<'hide-comment'> = async (
  {commentId, hide, commentType},
  auth,
) => {
  const pg = createSupabaseDirectClient()

  if (commentType === 'vote') {
    const comment = await pg.oneOrNone<Row<'vote_comments'>>(
      `select * from vote_comments where id = $1`,
      [commentId],
    )
    if (!comment) throw APIErrors.notFound('Comment not found')

    // No "owner" equivalent of on_user_id here: a proposal's author doesn't get to delete arguments
    // against their own proposal. Only the comment's author and admins can.
    if (!isAdminId(auth.uid) && comment.user_id !== auth.uid) {
      throw APIErrors.forbidden('You are not allowed to hide this comment')
    }

    await pg.none(`update vote_comments set hidden = $2 where id = $1`, [commentId, hide])

    broadcastUpdatedVoteComment(convertVoteComment({...comment, hidden: hide}))
    return
  }

  const comment = await pg.oneOrNone<Row<'profile_comments'>>(
    `select * from profile_comments where id = $1`,
    [commentId],
  )
  if (!comment) {
    throw APIErrors.notFound('Comment not found')
  }

  if (!isAdminId(auth.uid) && comment.user_id !== auth.uid && comment.on_user_id !== auth.uid) {
    throw APIErrors.forbidden('You are not allowed to hide this comment')
  }

  await pg.none(`update profile_comments set hidden = $2 where id = $1`, [commentId, hide])

  broadcastUpdatedComment(convertComment(comment))
}
