import { Row } from 'common/supabase/utils'
import { getPrivateUser, getUser } from './utils'
import { createSupabaseDirectClient } from './supabase/init'
import { getNotificationDestinationsForUser } from 'common/user-notification-preferences'
import { Notification } from 'common/notifications'
import { insertNotificationToSupabase } from './supabase/notifications'
import { getProfile } from './love/supabase'

export const createLoveLikeNotification = async (like: Row<'love_likes'>) => {
  const { creator_id, target_id, like_id } = like

  const targetPrivateUser = await getPrivateUser(target_id)
  const profile = await getProfile(creator_id)

  if (!targetPrivateUser || !profile) return

  const { sendToBrowser } = getNotificationDestinationsForUser(
    targetPrivateUser,
    'new_love_like'
  )
  if (!sendToBrowser) return

  const id = `${creator_id}-${like_id}`
  const notification: Notification = {
    id,
    userId: target_id,
    reason: 'new_love_like',
    createdTime: Date.now(),
    isSeen: false,
    sourceId: like_id,
    sourceType: 'love_like',
    sourceUpdateType: 'created',
    sourceUserName: profile.user.name,
    sourceUserUsername: profile.user.username,
    sourceUserAvatarUrl: profile.pinned_url ?? profile.user.avatarUrl,
    sourceText: '',
  }
  const pg = createSupabaseDirectClient()
  return await insertNotificationToSupabase(notification, pg)
}

export const createLoveShipNotification = async (
  ship: Row<'love_ships'>,
  recipientId: string
) => {
  const { creator_id, target1_id, target2_id, ship_id } = ship
  const otherTargetId = target1_id === recipientId ? target2_id : target1_id

  const creator = await getUser(creator_id)
  const targetPrivateUser = await getPrivateUser(recipientId)
  const profile = await getProfile(otherTargetId)

  if (!creator || !targetPrivateUser || !profile) {
    console.error('Could not load user object', {
      creator,
      targetPrivateUser,
      profile,
    })
    return
  }

  const { sendToBrowser } = getNotificationDestinationsForUser(
    targetPrivateUser,
    'new_love_ship'
  )
  if (!sendToBrowser) return

  const id = `${creator_id}-${ship_id}`
  const notification: Notification = {
    id,
    userId: recipientId,
    reason: 'new_love_ship',
    createdTime: Date.now(),
    isSeen: false,
    sourceId: ship_id,
    sourceType: 'love_ship',
    sourceUpdateType: 'created',
    sourceUserName: profile.user.name,
    sourceUserUsername: profile.user.username,
    sourceUserAvatarUrl: profile.pinned_url ?? profile.user.avatarUrl,
    sourceText: '',
    data: {
      creatorId: creator_id,
      creatorName: creator.name,
      creatorUsername: creator.username,
      otherTargetId,
    },
  }
  const pg = createSupabaseDirectClient()
  return await insertNotificationToSupabase(notification, pg)
}
