// Notification template - stores the shared content for notifications sent to multiple users
export type NotificationTemplate = {
  id: string
  sourceType: string
  title?: string
  sourceText: string // May contain placeholders like "{user}"
  sourceSlug?: string
  sourceUserAvatarUrl?: string
  sourceUpdateType?: 'created' | 'updated' | 'deleted'
  createdTime: number
  data?: {[key: string]: any} // Static data for the template
}

// Notification template translations
export type NotificationTemplateTranslation = {
  templateId: string
  locale: string
  title?: string
  sourceText: string // May contain placeholders like "{user}"
  createdTime: number
}

// User-specific notification data (lightweight - references template)
export type UserNotification = {
  notificationId: string
  userId: string
  templateId: string
  isSeen: boolean
  viewTime?: number
  // Dynamic values to substitute in template placeholders
  templateData?: {[key: string]: string | number | boolean}
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
  data?: {[key: string]: any}

  sourceContractTitle?: string
  sourceContractCreatorUsername?: string
  sourceContractSlug?: string

  sourceSlug?: string
  sourceTitle?: string

  isSeenOnHref?: string

  // New field for template-based notifications
  templateId?: string

  // Dynamic values to substitute in template placeholders
  templateData?: {[key: string]: string | number | boolean}
}

export const NOTIFICATIONS_PER_PAGE = 30

// export async function getNotifications(db: SupabaseClient, userId: string, limit: number) {
//   const {data} = await db
//     .from('user_notifications')
//     .select('*')
//     .eq('user_id', userId)
//     .order('data->createdTime', {ascending: false} as any)
//     .limit(limit)
//   return data?.map((d: Row<'user_notifications'>) => d)
// }
//
// export async function getUnseenNotifications(db: SupabaseClient, userId: string, limit: number) {
//   const {data} = await db
//     .from('user_notifications')
//     .select('*')
//     .eq('user_id', userId)
//     .eq('data->>isSeen', 'false')
//     .order('data->createdTime', {ascending: false} as any)
//     .limit(limit)
//
//   return data?.map((d: Row<'user_notifications'>) => d) ?? []
// }
//
// export type NotificationReason = any
