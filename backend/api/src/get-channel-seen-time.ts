import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getLastSeenChannelTime: APIHandler<'get-channel-seen-time'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()
  const {channelIds} = props
  const unseens = await pg.map(
    `select distinct on (channel_id) channel_id, created_time
     from private_user_seen_message_channels
     where channel_id = any ($1)
       and user_id = $2
     order by channel_id, created_time desc
    `,
    [channelIds, auth.uid],
    (r) => [r.channel_id as number, r.created_time as string],
  )
  return unseens as [number, string][]
}
export const setChannelLastSeenTime: APIHandler<'set-channel-seen-time'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()
  const {channelId} = props
  await pg.none(
    `insert into private_user_seen_message_channels (user_id, channel_id)
     values ($1, $2)
    `,
    [auth.uid, channelId],
  )
}
