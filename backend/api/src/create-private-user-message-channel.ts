import {APIError, APIHandler} from 'api/helpers/endpoint'
import {addUsersToPrivateMessageChannel} from 'api/helpers/private-messages'
import {filterDefined} from 'common/util/array'
import * as admin from 'firebase-admin'
import {uniq} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getPrivateUser, getUser} from 'shared/utils'

export const createPrivateUserMessageChannel: APIHandler<
  'create-private-user-message-channel'
> = async (body, auth) => {
  // Do not use auth.creds.data as its info can be staled. It comes from a client token, which refreshes hourly or so
  const user = await admin.auth().getUser(auth.uid)
  // console.log(JSON.stringify(user, null, 2))
  if (!user?.emailVerified) {
    throw new APIError(403, 'You must verify your email to contact people.')
  }

  const userIds = uniq(body.userIds.concat(auth.uid))

  const pg = createSupabaseDirectClient()
  const creatorId = auth.uid

  const creator = await getUser(creatorId)
  if (!creator) throw new APIError(401, 'Your account was not found')
  if (creator.isBannedFromPosting) throw new APIError(403, 'You are banned')
  const toPrivateUsers = filterDefined(await Promise.all(userIds.map((id) => getPrivateUser(id))))

  if (toPrivateUsers.length !== userIds.length)
    throw new APIError(
      404,
      `Private user ${userIds.find(
        (uid) => !toPrivateUsers.map((p: any) => p.id).includes(uid),
      )} not found`,
    )

  if (
    toPrivateUsers.some((user: any) =>
      user.blockedUserIds.some((blockedId: string) => userIds.includes(blockedId)),
    )
  ) {
    throw new APIError(403, 'One of the users has blocked another user in the list')
  }

  const currentChannel = await pg.oneOrNone(
    `
        select channel_id
        from private_user_message_channel_members
        group by channel_id
        having array_agg(user_id::text) @> array [$1]::text[]
           and array_agg(user_id::text) <@ array [$1]::text[]
    `,
    [userIds],
  )
  if (currentChannel)
    return {
      status: 'success',
      channelId: Number(currentChannel.channel_id),
    }

  const channel = await pg.one(
    `insert into private_user_message_channels default
     values
     returning id`,
  )

  await pg.none(
    `insert into private_user_message_channel_members (channel_id, user_id, role, status)
     values ($1, $2, 'creator', 'joined')
    `,
    [channel.id, creatorId],
  )

  const memberIds = userIds.filter((id) => id !== creatorId)
  await addUsersToPrivateMessageChannel(memberIds, channel.id, pg)
  return {status: 'success', channelId: Number(channel.id)}
}
