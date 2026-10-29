import {getChangeableOwnMessage} from 'api/helpers/own-message'
import {broadcastPrivateMessages} from 'api/helpers/private-messages'
import {encryptMessage} from 'shared/encryption'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const editMessage: APIHandler<'edit-message'> = async ({messageId, content}, auth) => {
  const pg = createSupabaseDirectClient()

  // Verify user is the message author, is still in the chat and is not blocked by anyone in it
  const message = await getChangeableOwnMessage(pg, messageId, auth.uid, {includeDeleted: false})

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
