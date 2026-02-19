import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {broadcastPrivateMessages} from 'api/helpers/private-messages'

// const DELETED_MESSAGE_CONTENT: JSONContent = {
//   type: 'doc',
//   content: [
//     {
//       type: 'paragraph',
//       content: [
//         {
//           type: 'text',
//           text: '[deleted]',
//         },
//       ],
//     },
//   ],
// }

export const deleteMessage: APIHandler<'delete-message'> = async ({messageId}, auth) => {
  const pg = createSupabaseDirectClient()

  // Verify user is the message author and message is not too old
  const message = await pg.oneOrNone(
    `SELECT *
     FROM private_user_messages
     WHERE id = $1
       AND user_id = $2`,
    [messageId, auth.uid],
  )

  if (!message) {
    throw new APIError(404, 'Message not found')
  }

  // Soft delete the message
  // await pg.none(
  //   `UPDATE private_user_messages
  //    SET deleted = TRUE,
  //        content = $2::jsonb,
  //        ciphertext = NULL,
  //        iv = NULL,
  //        tag = NULL
  //    WHERE id = $1`,
  //   [messageId, DELETED_MESSAGE_CONTENT]
  // )

  // Hard delete the message
  await pg.none(
    `DELETE
     FROM private_user_messages
     WHERE id = $1
       AND user_id = $2`,
    [messageId, auth.uid],
  )

  void broadcastPrivateMessages(pg, message.channel_id, auth.uid).catch((err) => {
    console.error('broadcastPrivateMessages failed', err)
  })

  return {success: true}
}
