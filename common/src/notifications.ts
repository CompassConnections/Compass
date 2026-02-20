import {Row, SupabaseClient} from 'common/supabase/utils'

// Notification template - stores the shared content for notifications sent to multiple users
export type NotificationTemplate = {
  id: string
  sourceType: string
  title?: string
  sourceText: string
  sourceSlug?: string
  sourceUserAvatarUrl?: string
  sourceUpdateType?: 'created' | 'updated' | 'deleted'
  createdTime: number
  data?: { [key: string]: any }
}

// User-specific notification data (lightweight - references template)
export type UserNotification = {
  notificationId: string
  userId: string
  templateId: string
  isSeen: boolean
  viewTime?: number
}

// Full notification (combines template + user data) - for backwards compatibility
export type Notification = {
  id: string
  userId: string
  title?: string
  reasonText?: string
  reason?: string
  createdTime: number
  viewTime?: number
  isSeen: boolean

  sourceId?: string
  sourceType: string
  sourceUpdateType?: 'created' | 'updated' | 'deleted'

  sourceUserName?: string
  sourceUserUsername?: string
  sourceUserAvatarUrl?: string
  sourceText: string
  data?: { [key: string]: any }

  sourceContractTitle?: string
  sourceContractCreatorUsername?: string
  sourceContractSlug?: string

  sourceSlug?: string
  sourceTitle?: string

  isSeenOnHref?: string

  // New field for template-based notifications
  templateId?: string
}

// export const NOTIFICATION_TYPES_TO_SELECT = [
//   'new_match', // new match markets
//   'comment_on_profile', // endorsements
//   'profile_like',
//   'profile_ship',
// ]

export const NOTIFICATIONS_PER_PAGE = 30

export async function getNotifications(
  db: SupabaseClient,
  userId: string,
  limit: number
) {
  const { data } = await db
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('data->createdTime', { ascending: false } as any)
    .limit(limit)
  return data?.map((d: Row<'user_notifications'>) => d)
}

export async function getUnseenNotifications(
  db: SupabaseClient,
  userId: string,
  limit: number
) {
  const { data } = await db
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('data->>isSeen', 'false')
    .order('data->createdTime', { ascending: false } as any)
    .limit(limit)

  return data?.map((d: Row<'user_notifications'>) => d) ?? []
}

export type NotificationReason = any // TODO
