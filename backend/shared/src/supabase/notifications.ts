import {Notification, NotificationTemplate} from 'common/notifications'
import {Row} from 'common/supabase/utils'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {bulkInsert} from 'shared/supabase/utils'
import {broadcast} from 'shared/websockets/server'

/**
 * Type for notification template translations
 */
export type NotificationTemplateTranslation = Row<'notification_template_translations'>

/**
 * Insert a single notification to a single user.
 * For backwards compatibility - stores full notification data.
 * Consider using createNotificationTemplate + createUserNotifications for new code.
 */
export const insertNotificationToSupabase = async (
  notification: Notification,
  pg?: SupabaseDirectClient,
) => {
  pg = pg ?? createSupabaseDirectClient()
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
          templateData: notification.templateData || {}, // Store dynamic template data
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
): Promise<string> => {
  const pg = createSupabaseDirectClient()
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
 * Create notification template translations
 */
export const createNotificationTemplateTranslations = async (
  translations: NotificationTemplateTranslation[],
): Promise<void> => {
  if (translations.length === 0) return
  const pg = createSupabaseDirectClient()

  await bulkInsert(pg, 'notification_template_translations', translations)
}

/**
 * Create a notification template with translations
 * Creates both the base template (in English) and translations
 */
export const createNotificationTemplateWithTranslations = async (
  template: NotificationTemplate,
  translations: Omit<NotificationTemplateTranslation, 'template_id' | 'created_time'>[],
): Promise<string> => {
  // Create the base template
  await createNotificationTemplate(template)

  // Add template_id to translations and create them
  if (translations.length > 0) {
    const fullTranslations: NotificationTemplateTranslation[] = translations.map(
      (t) =>
        ({
          ...t,
          template_id: template.id,
        }) as NotificationTemplateTranslation,
    )

    await createNotificationTemplateTranslations(fullTranslations)
  }

  return template.id
}

/**
 * Create user notifications that reference a template
 * Lightweight - only stores user_id, notification_id, template_id, and user-specific data
 */
export const createUserNotifications = async (
  templateId: string,
  userIds: string[],
  templateData?: {[key: string]: string | number | boolean}, // Dynamic data for template placeholders
  // baseNotificationId?: string
) => {
  const timestamp = Date.now()
  const pg = createSupabaseDirectClient()
  const notifications = userIds.map((userId, index) => ({
    user_id: userId,
    notification_id: `${templateId}-${userId}-${timestamp}-${index}`,
    template_id: templateId,
    data: {
      isSeen: false,
      templateData: templateData || {}, // Store dynamic template data
    },
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

async function getUserIds() {
  const pg = createSupabaseDirectClient()

  // Fetch all users
  const {data: users, error} = await tryCatch(pg.many<Row<'users'>>('select id from users'))

  if (error) {
    console.error('Error fetching users', error)
    return
  }

  if (!users || users.length === 0) {
    console.error('No users found')
    return
  }

  const userIds = users.map((u: Row<'users'>) => u.id)

  return userIds
}

/**
 * Create a bulk notification using the template system
 * Creates one template and many lightweight user notification entries
 * Optionally includes translations
 * Each template can have dynamic (user-dependent) data
 */
export const createBulkNotification = async (
  template: Omit<NotificationTemplate, 'id' | 'createdTime'>,
  translations?: Omit<NotificationTemplateTranslation, 'template_id' | 'created_time'>[],
  templateData?: {[key: string]: string | number | boolean}, // Dynamic data for template placeholders
  userIds?: string[],
) => {
  if (!userIds) {
    userIds = await getUserIds()
    if (!userIds) return {}
  }
  const timestamp = Date.now()
  const templateId = `${template.sourceType}-${timestamp}`

  // Create the template with translations if provided
  if (translations && translations.length > 0) {
    await createNotificationTemplateWithTranslations(
      {
        ...template,
        id: templateId,
        createdTime: timestamp,
      },
      translations,
    )
  } else {
    // Create just the base template
    await createNotificationTemplate({
      ...template,
      id: templateId,
      createdTime: timestamp,
    })
  }

  // Create lightweight user notifications with template data
  const count = await createUserNotifications(templateId, userIds, templateData)

  return {templateId, count}
}
