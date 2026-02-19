import {APIError, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {convertComment} from 'common/supabase/comment'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {broadcastUpdatedComment} from 'shared/websockets/helpers'

export const hideComment: APIHandler<'hide-comment'> = async ({commentId, hide}, auth) => {
  const pg = createSupabaseDirectClient()
  const comment = await pg.oneOrNone<Row<'profile_comments'>>(
    `select * from profile_comments where id = $1`,
    [commentId],
  )
  if (!comment) {
    throw new APIError(404, 'Comment not found')
  }

  if (!isAdminId(auth.uid) && comment.user_id !== auth.uid && comment.on_user_id !== auth.uid) {
    throw new APIError(403, 'You are not allowed to hide this comment')
  }

  await pg.none(`update profile_comments set hidden = $2 where id = $1`, [commentId, hide])

  broadcastUpdatedComment(convertComment(comment))
}
