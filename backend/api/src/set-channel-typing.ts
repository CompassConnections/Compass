import {createSupabaseDirectClient} from 'shared/supabase/init'
import {broadcastTyping} from 'shared/websockets/helpers'

import {APIErrors, APIHandler} from './helpers/endpoint'

/**
 * The "… is typing" indicator. Nothing is stored: the composer pings this every few seconds while its
 * owner types, and each ping is relayed to the channel's other members, whose chat shows the indicator
 * until the pings stop (or the message lands).
 */
export const setChannelTyping: APIHandler<'set-channel-typing'> = async ({channelId}, auth) => {
  const pg = createSupabaseDirectClient()

  const memberIds = await pg.map<string>(
    `select user_id
     from private_user_message_channel_members
     where channel_id = $1
       and status != 'left'`,
    [channelId],
    (r) => r.user_id,
  )
  if (!memberIds.includes(auth.uid)) {
    throw APIErrors.forbidden('Not a member of this channel')
  }

  broadcastTyping(
    channelId,
    auth.uid,
    memberIds.filter((id) => id !== auth.uid),
  )
}
