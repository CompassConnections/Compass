import {Json} from 'common/supabase/schema'
import {SupabaseDirectClient} from 'shared/supabase/init'
import {ChatVisibility} from 'common/chat-message'
import {User} from 'common/user'
import {first} from 'lodash'
import {log} from 'shared/monitoring/log'
import {getPrivateUser, getUser} from 'shared/utils'
import {type JSONContent} from '@tiptap/core'
import {APIError} from 'common/api/utils'
import {broadcast} from 'shared/websockets/server'
import {track} from 'shared/analytics'
import {sendNewMessageEmail} from 'email/functions/helpers'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import webPush from 'web-push';

dayjs.extend(utc)
dayjs.extend(timezone)

export const leaveChatContent = (userName: string) => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{text: `${userName} left the chat`, type: 'text'}],
    },
  ],
})
export const joinChatContent = (userName: string) => {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{text: `${userName} joined the chat!`, type: 'text'}],
      },
    ],
  }
}

export const insertPrivateMessage = async (
  content: Json,
  channelId: number,
  userId: string,
  visibility: ChatVisibility,
  pg: SupabaseDirectClient
) => {
  const lastMessage = await pg.one(
    `insert into private_user_messages (content, channel_id, user_id, visibility)
     values ($1, $2, $3, $4)
     returning created_time`,
    [content, channelId, userId, visibility]
  )
  await pg.none(
    `update private_user_message_channels
     set last_updated_time = $1
     where id = $2`,
    [lastMessage.created_time, channelId]
  )
}

export const addUsersToPrivateMessageChannel = async (
  userIds: string[],
  channelId: number,
  pg: SupabaseDirectClient
) => {
  await Promise.all(
    userIds.map((id) =>
      pg.none(
        `insert into private_user_message_channel_members (channel_id, user_id, role, status)
         values ($1, $2, 'member', 'proposed')
         on conflict do nothing
        `,
        [channelId, id]
      )
    )
  )
  await pg.none(
    `update private_user_message_channels
     set last_updated_time = now()
     where id = $1`,
    [channelId]
  )
}

export const createPrivateUserMessageMain = async (
  creator: User,
  channelId: number,
  content: JSONContent,
  pg: SupabaseDirectClient,
  visibility: ChatVisibility
) => {
  log('createPrivateUserMessageMain', creator, channelId, content)
  // Normally, users can only submit messages to channels that they are members of
  const authorized = await pg.oneOrNone(
    `select 1
     from private_user_message_channel_members
     where channel_id = $1
       and user_id = $2`,
    [channelId, creator.id]
  )
  if (!authorized)
    throw new APIError(403, 'You are not authorized to post to this channel')

  await notifyOtherUserInChannelIfInactive(channelId, creator, pg)
  await insertPrivateMessage(content, channelId, creator.id, visibility, pg)

  const privateMessage = {
    content: content as Json,
    channel_id: channelId,
    user_id: creator.id,
  }

  const otherUserIds = await pg.map<string>(
    `select user_id
     from private_user_message_channel_members
     where channel_id = $1
       and user_id != $2
       and status != 'left'
    `,
    [channelId, creator.id],
    (r) => r.user_id
  )
  otherUserIds.concat(creator.id).forEach((otherUserId) => {
    broadcast(`private-user-messages/${otherUserId}`, {})
  })

  track(creator.id, 'send private message', {
    channelId,
    otherUserIds,
  })

  return privateMessage
}

const notifyOtherUserInChannelIfInactive = async (
  channelId: number,
  creator: User,
  pg: SupabaseDirectClient
) => {
  const otherUserIds = await pg.manyOrNone<{ user_id: string }>(
    `select user_id
     from private_user_message_channel_members
     where channel_id = $1
       and user_id != $2
       and status != 'left'
    `,
    [channelId, creator.id]
  )
  // We're only sending notifs for 1:1 channels
  if (!otherUserIds || otherUserIds.length > 1) return

  const otherUserId = first(otherUserIds)
  if (!otherUserId) return

  const startOfDay = dayjs()
    .tz('America/Los_Angeles')
    .startOf('day')
    .toISOString()
  const previousMessagesThisDayBetweenTheseUsers = await pg.one(
    `select count(*)
     from private_user_messages
     where channel_id = $1
       and user_id = $2
       and created_time > $3
    `,
    [channelId, creator.id, startOfDay]
  )
  log('previous messages this day', previousMessagesThisDayBetweenTheseUsers)
  if (previousMessagesThisDayBetweenTheseUsers.count > 0) return

  // TODO: notification only for active user

  const otherUser = await getUser(otherUserId.user_id)
  console.debug('otherUser:', otherUser)
  if (!otherUser) return

  await createNewMessageNotification(creator, otherUser, channelId, pg)
}

const createNewMessageNotification = async (
  fromUser: User,
  toUser: User,
  channelId: number,
  pg: SupabaseDirectClient
) => {
  const privateUser = await getPrivateUser(toUser.id)
  console.debug('privateUser:', privateUser)
  if (!privateUser) return

  webPush.setVapidDetails(
    'mailto:you@example.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // Retrieve subscription from your database
  const subscriptions = await getSubscriptionsFromDB(toUser.id, pg);

  for (const subscription of subscriptions) {
    try {
      console.log('Sending notification to:', subscription.endpoint);
      await webPush.sendNotification(subscription, JSON.stringify({
        title: `Message from ${fromUser.name}`,
        body: 'You have a new message!',
        url: `/messages/${channelId}`,
      }));
    } catch (err) {
      console.error('Failed to send notification', err);
      // optionally remove invalid subscription from DB
    }
  }

  await sendNewMessageEmail(privateUser, fromUser, toUser, channelId)
}


export async function getSubscriptionsFromDB(
  userId: string,
  pg: SupabaseDirectClient
) {
  try {
    const subscriptions = await pg.manyOrNone(`
      select endpoint, keys from push_subscriptions
      where user_id = $1
      `, [userId]
    );

    return subscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }));
  } catch (err) {
    console.error('Error fetching subscriptions', err);
    return [];
  }
}
