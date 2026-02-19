import {createSupabaseDirectClient} from 'shared/supabase/init'
import {APIHandler} from './helpers/endpoint'

export const markAllNotifsRead: APIHandler<'mark-all-notifs-read'> = async (_, auth) => {
  const pg = createSupabaseDirectClient()
  await pg.none(
    `update user_notifications
     SET data = jsonb_set(data, '{isSeen}', 'true'::jsonb)
    where user_id = $1
    and data->>'isSeen' = 'false'`,
    [auth.uid],
  )
}
