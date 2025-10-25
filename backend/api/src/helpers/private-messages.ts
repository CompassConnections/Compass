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
import {parseJsonContentToText} from "common/util/parse";
import {encryptMessage} from "shared/encryption";

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
  const plaintext = JSON.stringify(content);
  const {ciphertext, iv, tag} = encryptMessage(plaintext);
  const lastMessage = await pg.one(
    `insert into private_user_messages (ciphertext, iv, tag, channel_id, user_id, visibility)
     values ($1, $2, $3, $4, $5, $6)
     returning created_time`,
    [ciphertext, iv, tag, channelId, userId, visibility]
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

  // Fire and forget safely
  void notifyOtherUserInChannelIfInactive(channelId, creator, content, pg)
    .catch((err) => {
      console.error('notifyOtherUserInChannelIfInactive failed', err)
    });

  track(creator.id, 'send private message', {
    channelId,
    otherUserIds,
  })

  return privateMessage
}

const notifyOtherUserInChannelIfInactive = async (
  channelId: number,
  creator: User,
  content: JSONContent,
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

  // TODO: notification only for active user

  const otherUser = await getUser(otherUserId.user_id)
  console.debug('otherUser:', otherUser)
  if (!otherUser) return

  // Push notif
  webPush.setVapidDetails(
    'mailto:hello@compassmeet.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const textContent = parseJsonContentToText(content)
  // Retrieve subscription from the database
  const subscriptions = await getSubscriptionsFromDB(otherUser.id, pg);
  for (const subscription of subscriptions) {
    try {
      const payload = JSON.stringify({
        title: `${creator.name}`,
        body: textContent,
        url: `/messages/${channelId}`,
      })
      console.log('Sending notification to:', subscription.endpoint, payload);
      await webPush.sendNotification(subscription, payload);
    } catch (err: any) {
      console.log('Failed to send notification', err);
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.warn('Removing expired subscription', subscription.endpoint);
        await pg.none(
          `DELETE
           FROM push_subscriptions
           WHERE endpoint = $1
             AND user_id = $2`,
          [subscription.endpoint, otherUser.id]
        );
      } else {
        console.error('Push failed', err);
      }
    }
  }

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
  if (previousMessagesThisDayBetweenTheseUsers.count > 1) return

  await createNewMessageNotification(creator, otherUser, channelId)
}

const createNewMessageNotification = async (
  fromUser: User,
  toUser: User,
  channelId: number,
) => {
  const privateUser = await getPrivateUser(toUser.id)
  console.debug('privateUser:', privateUser)
  if (!privateUser) return
  await sendNewMessageEmail(privateUser, fromUser, toUser, channelId)
}


export async function getSubscriptionsFromDB(
  userId: string,
  pg: SupabaseDirectClient
) {
  try {
    const subscriptions = await pg.manyOrNone(`
                select endpoint, keys
                from push_subscriptions
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
