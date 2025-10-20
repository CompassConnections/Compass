import { Row, SupabaseClient } from 'common/supabase/utils'

export type Notification = {
  id: string
  userId: string
  reasonText?: string
  reason: string
  createdTime: number
  viewTime?: number
  isSeen: boolean

  sourceId: string
  sourceType: string
  sourceUpdateType?: 'created' | 'updated' | 'deleted'

  sourceUserName: string
  sourceUserUsername: string
  sourceUserAvatarUrl: string
  sourceText: string
  data?: { [key: string]: any }

  sourceContractTitle?: string
  sourceContractCreatorUsername?: string
  sourceContractSlug?: string

  sourceSlug?: string
  sourceTitle?: string

  isSeenOnHref?: string
}

export const NOTIFICATION_TYPES_TO_SELECT = [
  'new_match', // new match markets
  'comment_on_profile', // endorsements
  'profile_like',
  'love_ship',
]

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
