import {createSupabaseDirectClient} from 'shared/supabase/init'
import {APIHandler} from 'api/helpers/endpoint'
import {Notification} from 'common/notifications'

export const getNotifications: APIHandler<'get-notifications'> = async (props, auth) => {
  const {limit, after} = props
  const pg = createSupabaseDirectClient()
  const query = `
      select case
                 when un.template_id is not null then
                     jsonb_build_object(
                             'id', un.notification_id,
                             'userId', un.user_id,
                             'templateId', un.template_id,
                             'title', nt.title,
                             'sourceType', nt.source_type,
                             'sourceUpdateType', nt.source_update_type,
                             'createdTime', nt.created_time,
                             'isSeen', coalesce((un.data ->> 'isSeen')::boolean, false),
                             'viewTime', (un.data ->> 'viewTime')::bigint,
                             'sourceText', nt.source_text,
                             'sourceSlug', nt.source_slug,
                             'sourceUserAvatarUrl', nt.source_user_avatar_url,
                             'data', nt.data
                     )
                 else
                     un.data
                 end as notification_data
      from user_notifications un
               left join notification_templates nt on un.template_id = nt.id
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
  return await pg.map(
    query,
    [auth.uid, limit, after],
    (row) => row.notification_data as Notification,
  )
}
