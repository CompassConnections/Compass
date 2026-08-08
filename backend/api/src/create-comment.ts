import {type JSONContent} from '@tiptap/core'
import {MAX_COMMENT_JSON_LENGTH, validateCommentAuthor} from 'api/helpers/comment'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {Notification} from 'common/notifications'
import {convertComment} from 'common/supabase/comment'
import {type Row} from 'common/supabase/utils'
import {User} from 'common/user'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {richTextToString} from 'common/util/parse'
import * as crypto from 'crypto'
import {sendNewEndorsementEmail} from 'email/functions/helpers'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser, getUser} from 'shared/utils'
import {broadcastUpdatedComment} from 'shared/websockets/helpers'

export {MAX_COMMENT_JSON_LENGTH}

export const createComment: APIHandler<'create-comment'> = async (
  {userId, content: submittedContent, replyToCommentId},
  auth,
) => {
  const {creator, content} = await validateComment(userId, auth.uid, submittedContent)

  const onUser = await getUser(userId)
  if (!onUser) throw APIErrors.notFound('User not found')

  const pg = createSupabaseDirectClient()
  const comment = await pg.one<Row<'profile_comments'>>(
    `insert into profile_comments (user_id, user_name, user_username, user_avatar_url, on_user_id, content, reply_to_comment_id)
        values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [
      creator.id,
      creator.name,
      creator.username,
      // Nullable in the DB even though `User.avatarUrl` is typed `string` — see the vote-comment
      // handler for the same coercion.
      creator.avatarUrl ?? null,
      userId,
      content,
      replyToCommentId,
    ],
  )
  if (onUser.id !== creator.id)
    await createNewCommentOnProfileNotification(
      onUser,
      creator,
      richTextToString(content),
      comment.id,
    )

  broadcastUpdatedComment(convertComment(comment))

  return {status: 'success'}
}

const validateComment = async (userId: string, creatorId: string, content: JSONContent) => {
  const {creator} = await validateCommentAuthor(creatorId, content)

  const otherUser = await getPrivateUser(userId)
  if (!otherUser) throw APIErrors.notFound('Other user not found')
  if (otherUser.blockedUserIds.includes(creatorId)) {
    throw APIErrors.notFound('User has blocked you')
  }

  return {content, creator}
}

const createNewCommentOnProfileNotification = async (
  onUser: User,
  creator: User,
  sourceText: string,
  commentId: number,
) => {
  const privateUser = await getPrivateUser(onUser.id)
  if (!privateUser) return
  const id = crypto.randomUUID()
  const reason = 'new_endorsement'
  const {sendToBrowser, sendToMobile, sendToEmail} = getNotificationDestinationsForUser(
    privateUser,
    reason,
  )
  const notification: Notification = {
    id,
    userId: privateUser.id,
    reason,
    createdTime: Date.now(),
    isSeen: false,
    sourceId: commentId.toString(),
    sourceType: 'comment_on_profile',
    sourceUpdateType: 'created',
    sourceUserName: creator.name,
    sourceUserUsername: creator.username,
    sourceUserAvatarUrl: creator.avatarUrl,
    sourceText: sourceText,
    sourceSlug: onUser.username,
  }
  if (sendToBrowser) {
    await insertNotificationToSupabase(notification)
  }
  if (sendToMobile) {
    // await createPushNotification(
    //   notification,
    //   privateUser,
    //   `${creator.name} commented on your profile`,
    //   sourceText
    // )
  }
  if (sendToEmail) {
    await sendNewEndorsementEmail(privateUser, creator, onUser, sourceText)
  }
}
