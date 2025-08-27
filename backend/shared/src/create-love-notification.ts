import { Row } from 'common/supabase/utils'
import { getPrivateUser, getUser } from './utils'
import { createSupabaseDirectClient } from './supabase/init'
import { getNotificationDestinationsForUser } from 'common/user-notification-preferences'
import { Notification } from 'common/notifications'
import { insertNotificationToSupabase } from './supabase/notifications'
import { getLover } from './love/supabase'

export const createLoveLikeNotification = async (like: Row<'love_likes'>) => {
  const { creator_id, target_id, like_id } = like

  const targetPrivateUser = await getPrivateUser(target_id)
  const lover = await getLover(creator_id)

  if (!targetPrivateUser || !lover) return

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
    sourceUserName: lover.user.name,
    sourceUserUsername: lover.user.username,
    sourceUserAvatarUrl: lover.pinned_url ?? lover.user.avatarUrl,
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
  const lover = await getLover(otherTargetId)

  if (!creator || !targetPrivateUser || !lover) {
    console.error('Could not load user object', {
      creator,
      targetPrivateUser,
      lover,
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
    sourceUserName: lover.user.name,
    sourceUserUsername: lover.user.username,
    sourceUserAvatarUrl: lover.pinned_url ?? lover.user.avatarUrl,
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
