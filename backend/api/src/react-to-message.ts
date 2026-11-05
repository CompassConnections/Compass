import {broadcastPrivateMessages} from 'api/helpers/private-messages'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

// `reactions` maps each emoji to the ids of the members who used it. This takes one member ($2) off
// one emoji ($1), and drops the emoji once they were the last on it. The scalar comparison covers old
// rows holding a bare id rather than a list, which `MessageReactions` also tolerates.
const WITHOUT_REACTOR = `
  CASE
    WHEN reactions -> $1 IN (to_jsonb($2::text), to_jsonb(ARRAY [$2::text]))
      THEN reactions - $1
    ELSE jsonb_set(reactions, ARRAY [$1], (reactions -> $1) - $2::text)
  END`

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
       AND msg.id = $2
       AND m.status != 'left'`,
    [auth.uid, messageId],
  )

  if (!message) {
    throw APIErrors.forbidden('Not authorized to react to this message')
  }

  if (toDelete) {
    // Remove the reaction
    await pg.none(
      `UPDATE private_user_messages
       SET reactions = ${WITHOUT_REACTOR}
       WHERE id = $3
       AND reactions -> $1 ? $2`,
      [reaction, auth.uid, messageId],
    )
  } else {
    // Toggle reaction
    await pg.none(
      `UPDATE private_user_messages
       SET reactions =
               CASE
                   WHEN reactions -> $1 ? $2
                       THEN ${WITHOUT_REACTOR}
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
