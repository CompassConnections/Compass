import {broadcastPrivateMessages} from 'api/helpers/private-messages'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIError, APIHandler} from './helpers/endpoint'

export const reactToMessage: APIHandler<'react-to-message'> = async (
  {messageId, reaction, toDelete},
  auth,
) => {
  const pg = createSupabaseDirectClient()

  // Verify user is a member of the channel
  const message = await pg.oneOrNone(
    `SELECT *
     FROM private_user_message_channel_members m
              JOIN private_user_messages msg ON msg.channel_id = m.channel_id
     WHERE m.user_id = $1
       AND msg.id = $2`,
    [auth.uid, messageId],
  )

  if (!message) {
    throw new APIError(403, 'Not authorized to react to this message')
  }

  if (toDelete) {
    // Remove the reaction
    await pg.none(
      `UPDATE private_user_messages
       SET reactions = reactions - $1
       WHERE id = $2
       AND reactions -> $1 ? $3`,
      [reaction, messageId, auth.uid],
    )
  } else {
    // Toggle reaction
    await pg.none(
      `UPDATE private_user_messages
       SET reactions =
               CASE
                   WHEN reactions -> $1 IS NOT NULL
                       THEN reactions - $1
                   ELSE jsonb_set(
                           COALESCE(reactions, '{}'::jsonb),
                           ARRAY [$1],
                           (
                               COALESCE(reactions -> $1, '[]'::jsonb) || to_jsonb($2::text)
                               ),
                           TRUE
                        )
                   END
       WHERE id = $3`,
      [reaction, auth.uid, messageId],
    )
  }

  void broadcastPrivateMessages(pg, message.channel_id, auth.uid).catch((err) => {
    console.error('broadcastPrivateMessages failed', err)
  })

  return {success: true}
}
