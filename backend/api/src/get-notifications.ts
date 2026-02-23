import {APIHandler} from 'api/helpers/endpoint'
import {defaultLocale} from 'common/constants'
import {Notification} from 'common/notifications'
import {createSupabaseDirectClient} from 'shared/supabase/init'

// Helper function to substitute placeholders in template text
function substitutePlaceholders(templateText: string, templateData: any): string {
  let result = templateText
  if (templateData) {
    for (const [key, value] of Object.entries(templateData)) {
      // Replace all occurrences of {key} with the value
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
    }
  }
  return result
}

export const getNotifications: APIHandler<'get-notifications'> = async (props, auth, _req) => {
  const {limit, after, locale = defaultLocale} = props
  const pg = createSupabaseDirectClient()

  const query = `
      select case
                 when un.template_id is not null then
                     jsonb_build_object(
                             'id', un.notification_id,
                             'userId', un.user_id,
                             'templateId', un.template_id,
                             'title', COALESCE(ntt.title, nt.title),
                             'sourceType', nt.source_type,
                             'sourceUpdateType', nt.source_update_type,
                             'createdTime', nt.created_time,
                             'isSeen', coalesce((un.data ->> 'isSeen')::boolean, false),
                             'viewTime', (un.data ->> 'viewTime')::bigint,
                             'sourceText', COALESCE(ntt.source_text, nt.source_text),
                             'sourceSlug', nt.source_slug,
                             'sourceUserAvatarUrl', nt.source_user_avatar_url,
                             'data', nt.data,
                             'templateData', un.data->'templateData'
                     )
                 else
                     un.data
                 end as notification_data
      from user_notifications un
               left join notification_templates nt on un.template_id = nt.id
               left join notification_template_translations ntt 
                   on nt.id = ntt.template_id 
                   and ntt.locale = $4  -- User's locale
      where un.user_id = $1
        and ($3 is null or
             case
                 when un.template_id is not null then nt.created_time > $3
                 else (un.data ->> 'createdTime')::bigint > $3
                 end
           )
      order by case
                   when un.template_id is not null then nt.created_time
                   else (un.data ->> 'createdTime')::bigint
                   end desc
    limit $2
  `

  const rawNotifications = await pg.map(
    query,
    [auth.uid, limit, after, locale],
    (row) => row.notification_data,
  )

  // Process notifications to apply template data substitution
  const processedNotifications: Notification[] = rawNotifications.map((notif: any) => {
    if (notif.templateId) {
      // Apply template data substitution to title and sourceText
      const templateData = notif.templateData || {}
      const processedNotif = {...notif}

      if (processedNotif.title) {
        processedNotif.title = substitutePlaceholders(processedNotif.title, templateData)
      }

      if (processedNotif.sourceText) {
        processedNotif.sourceText = substitutePlaceholders(processedNotif.sourceText, templateData)
      }

      return processedNotif as Notification
    }
    return notif as Notification
  })

  return processedNotifications
}
