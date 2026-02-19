import {APIError, APIHandler} from 'api/helpers/endpoint'
import {getUser, log} from 'shared/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {millisToTs} from 'common/supabase/utils'

export const updatePrivateUserMessageChannel: APIHandler<
  'update-private-user-message-channel'
> = async (body, auth) => {
  const {channelId, notifyAfterTime} = body
  const pg = createSupabaseDirectClient()
  const user = await getUser(auth.uid)
  if (!user) throw new APIError(401, 'Your account was not found')

  const membershipStatus = await pg.oneOrNone(
    `select status from private_user_message_channel_members
                where channel_id = $1 and user_id = $2`,
    [channelId, auth.uid],
  )
  if (!membershipStatus) throw new APIError(403, 'You are not authorized to this channel')
  log('membershipStatus ' + membershipStatus)

  await pg.none(
    `
      update private_user_message_channel_members
        set notify_after_time = $3
        where channel_id=$1 and user_id=$2;
      `,
    [channelId, auth.uid, millisToTs(notifyAfterTime)],
  )

  return {status: 'success', channelId: Number(channelId)}
}
