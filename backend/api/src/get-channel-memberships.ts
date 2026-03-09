import {APIHandler} from 'api/helpers/endpoint'
import {PrivateMessageChannel} from 'common/supabase/private-messages'
import {groupBy, mapValues} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getChannelMemberships: APIHandler<'get-channel-memberships'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()
  const {channelId, lastUpdatedTime, createdTime, limit} = props

  let channels: PrivateMessageChannel[]
  const convertRow = (r: any) => ({
    channel_id: r.channel_id as number,
    notify_after_time: r.notify_after_time as string,
    created_time: r.created_time as string,
    last_updated_time: r.last_updated_time as string,
  })

  if (channelId) {
    channels = await pg.map(
      `select channel_id, notify_after_time, pumcm.created_time, last_updated_time
       from private_user_message_channel_members pumcm
                join private_user_message_channels pumc on pumc.id = pumcm.channel_id
       where user_id = $1
         and channel_id = $2
       limit $3
      `,
      [auth.uid, channelId, limit],
      convertRow,
    )
  } else {
    channels = await pg.map(
      `with latest_channels as (select distinct on (pumc.id) pumc.id                as channel_id,
                                                             notify_after_time,
                                                             pumc.created_time,
                                                             (select created_time
                                                              from private_user_messages
                                                              where channel_id = pumc.id
                                                                and visibility != 'system_status'
                                                                and user_id != $1
                                                              order by created_time desc
                                                              limit 1)              as last_updated_time,        -- last_updated_time is the last possible unseen message time
                                                             pumc.last_updated_time as last_updated_channel_time -- last_updated_channel_time is the last time the channel was updated
                                from private_user_message_channels pumc
                                         join private_user_message_channel_members pumcm on pumcm.channel_id = pumc.id
                                         inner join private_user_messages pum on pumc.id = pum.channel_id
                                    and (pum.visibility != 'introduction' or pum.user_id != $1)
                                where pumcm.user_id = $1
                                  and not status = 'left'
                                  and ($2 is null or pumcm.created_time > $2)
                                  and ($4 is null or pumc.last_updated_time > $4)
                                order by pumc.id, pumc.last_updated_time desc)
       select *
       from latest_channels
       order by last_updated_channel_time desc
       limit $3
      `,
      [auth.uid, createdTime ?? null, limit, lastUpdatedTime ?? null],
      convertRow,
    )
  }
  if (!channels || channels.length === 0) return {channels: [], memberIdsByChannelId: {}}
  const channelIds = channels.map((c) => c.channel_id)

  const members = await pg.map(
    `select channel_id, user_id
     from private_user_message_channel_members
     where not user_id = $1
       and channel_id in ($2:list)
       and not status = 'left'
    `,
    [auth.uid, channelIds],
    (r) => ({
      channel_id: r.channel_id as number,
      user_id: r.user_id as string,
    }),
  )

  const memberIdsByChannelId = mapValues(groupBy(members, 'channel_id'), (members) =>
    members.map((m) => m.user_id),
  )

  return {
    channels,
    memberIdsByChannelId,
  }
}
