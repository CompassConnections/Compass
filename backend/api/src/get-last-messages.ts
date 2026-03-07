import {PrivateChatMessage} from 'common/chat-message'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {convertPrivateChatMessage} from 'shared/supabase/messages'

import {APIHandler} from './helpers/endpoint'

export const getLastMessages: APIHandler<'get-last-messages'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()
  const {channelIds} = props

  const messages = await pg.map(
    `select distinct on (channel_id) channel_id, id, user_id, content, created_time, visibility, ciphertext, iv, tag
     from private_user_messages
     where visibility != 'system_status'
       and channel_id in (
       select channel_id from private_user_message_channel_members
       where user_id = $1 and not status = 'left'
     )
       ${channelIds ? 'and channel_id = any ($2)' : ''}
     order by channel_id, created_time desc
    `,
    [auth.uid, channelIds],
    convertPrivateChatMessage,
  )

  // Required to parse to number?  If so, should prob create a helper to reuse in other places?
  return messages.reduce(
    (acc, msg) => {
      acc[Number(msg.channelId)] = msg
      return acc
    },
    {} as Record<number, PrivateChatMessage>,
  )
}
