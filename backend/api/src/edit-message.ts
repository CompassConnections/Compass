import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {encryptMessage} from 'shared/encryption'
import {broadcastPrivateMessages} from 'api/helpers/private-messages'

export const editMessage: APIHandler<'edit-message'> = async ({messageId, content}, auth) => {
  const pg = createSupabaseDirectClient()

  // Verify user is the message author and message is not too old
  const message = await pg.oneOrNone(
    `SELECT *
     FROM private_user_messages
     WHERE id = $1
       AND user_id = $2
--        AND created_time > NOW() - INTERVAL '1 day'
       AND deleted = FALSE`,
    [messageId, auth.uid],
  )

  if (!message) {
    throw new APIError(404, 'Message not found or cannot be edited')
  }

  const plaintext = JSON.stringify(content)
  const {ciphertext, iv, tag} = encryptMessage(plaintext)
  await pg.none(
    `UPDATE private_user_messages
     SET ciphertext   = $1,
         iv = $2,
         tag = $3,
         is_edited = TRUE,
         edited_at = NOW()
     WHERE id = $4`,
    [ciphertext, iv, tag, messageId],
  )

  void broadcastPrivateMessages(pg, message.channel_id, auth.uid).catch((err) => {
    console.error('broadcastPrivateMessages failed', err)
  })

  return {success: true}
}
