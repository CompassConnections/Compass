import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {convertPrivateChatMessage} from 'shared/supabase/messages'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const getChannelMessagesEndpoint: APIHandler<'get-channel-messages'> = async (
  props,
  auth,
) => {
  const userId = auth.uid
  return await getChannelMessages({...props, userId})
}

export async function getChannelMessages(props: {
  channelId: number
  limit?: number
  id?: number | undefined
  beforeId?: number | undefined
  userId: string
}) {
  const {channelId, limit, id, beforeId, userId} = props
  const pg = createSupabaseDirectClient()
  const {data, error} = await tryCatch(
    pg.map(
      `select *, created_time as created_time_ts
     from private_user_messages
     where channel_id = $1
       and exists (select 1
                   from private_user_message_channel_members pumcm
                   where pumcm.user_id = $2
                     and pumcm.channel_id = $1)
       and ($4 is null or id > $4)
       and ($5 is null or id < $5)
       and not visibility = 'system_status'
     order by created_time desc
         ${limit ? 'limit $3' : ''}
    `,
      [channelId, userId, limit, id, beforeId],
      convertPrivateChatMessage,
    ),
  )
  if (error) {
    console.error('Error getting messages:', error)
    // If it's a connection pool error, provide more specific error message
    if (error.message && error.message.includes('MaxClientsInSessionMode')) {
      throw APIErrors.serviceUnavailable(
        'Service temporarily unavailable due to high demand. Please try again in a moment.',
      )
    }
    throw APIErrors.internalServerError('Error getting messages', {
      field: 'database',
      context: error.message || 'Unknown database error',
    })
  }
  // console.log('final messages', data)
  return data
}
