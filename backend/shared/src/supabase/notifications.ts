import {Notification, NotificationTemplate} from 'common/notifications'
import {SupabaseDirectClient} from 'shared/supabase/init'
import {bulkInsert} from 'shared/supabase/utils'
import {broadcast} from 'shared/websockets/server'

/**
 * Insert a single notification to a single user.
 * For backwards compatibility - stores full notification data.
 * Consider using createNotificationTemplate + createUserNotifications for new code.
 */
export const insertNotificationToSupabase = async (
  notification: Notification,
  pg: SupabaseDirectClient,
) => {
  // Check if this notification has a template_id (new style)
  if (notification.templateId) {
    await pg.none(
      `insert into user_notifications (user_id, notification_id, template_id, data)
       values ($1, $2, $3, $4)
       on conflict do nothing`,
      [
        notification.userId,
        notification.id,
        notification.templateId,
        {
          isSeen: notification.isSeen,
          viewTime: notification.viewTime,
        },
      ],
    )
  } else {
    // Legacy style - store full notification in data
    await pg.none(
      `insert into user_notifications (user_id, notification_id, data)
       values ($1, $2, $3)
       on conflict do nothing`,
      [notification.userId, notification.id, notification],
    )
  }
  broadcast(`user-notifications/${notification.userId}`, {notification})
}

/**
 * Bulk insert notifications - for backwards compatibility
 */
export const bulkInsertNotifications = async (
  notifications: Notification[],
  pg: SupabaseDirectClient,
) => {
  await bulkInsert(
    pg,
    'user_notifications',
    notifications.map((n) => ({
      user_id: n.userId,
      notification_id: n.id,
      data: n,
    })),
  )
  notifications.forEach((notification) =>
    broadcast(`user-notifications/${notification.userId}`, {notification}),
  )
}

/**
 * Create a notification template - stores shared notification content
 * Returns the template ID
 */
export const createNotificationTemplate = async (
  template: NotificationTemplate,
  pg: SupabaseDirectClient,
): Promise<string> => {
  await pg.none(
    `insert into notification_templates
     (id, source_type, title, source_text, source_slug, source_user_avatar_url, source_update_type, created_time, data)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update set source_type            = excluded.source_type,
                                    title                  = excluded.title,
                                    source_text            = excluded.source_text,
                                    source_slug            = excluded.source_slug,
                                    source_user_avatar_url = excluded.source_user_avatar_url,
                                    source_update_type     = excluded.source_update_type,
                                    data                   = excluded.data`,
    [
      template.id,
      template.sourceType,
      template.title ?? null,
      template.sourceText,
      template.sourceSlug ?? null,
      template.sourceUserAvatarUrl ?? null,
      template.sourceUpdateType ?? null,
      template.createdTime,
      template.data ?? {},
    ],
  )
  return template.id
}

/**
 * Create user notifications that reference a template
 * Lightweight - only stores user_id, notification_id, template_id, and user-specific data
 */
export const createUserNotifications = async (
  templateId: string,
  userIds: string[],
  pg: SupabaseDirectClient,
  // baseNotificationId?: string
) => {
  const timestamp = Date.now()
  const notifications = userIds.map((userId, index) => ({
    user_id: userId,
    notification_id: `${templateId}-${userId}-${timestamp}-${index}`,
    template_id: templateId,
    data: {isSeen: false},
  }))

  await bulkInsert(pg, 'user_notifications', notifications)

  // Broadcast to all users
  notifications.forEach((n) => {
    broadcast(`user-notifications/${n.user_id}`, {
      notification: {templateId, notificationId: n.notification_id},
    })
  })

  return notifications.length
}

/**
 * Create a bulk notification using the template system
 * Creates one template and many lightweight user notification entries
 */
export const createBulkNotification = async (
  template: Omit<NotificationTemplate, 'id' | 'createdTime'>,
  userIds: string[],
  pg: SupabaseDirectClient,
) => {
  const timestamp = Date.now()
  const templateId = `${template.sourceType}-${timestamp}`

  // Create the template
  await createNotificationTemplate(
    {
      ...template,
      id: templateId,
      createdTime: timestamp,
    },
    pg,
  )

  // Create lightweight user notifications
  const count = await createUserNotifications(templateId, userIds, pg)

  return {templateId, count}
}
