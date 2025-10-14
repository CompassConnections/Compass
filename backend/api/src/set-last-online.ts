import {APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const setLastOnline: APIHandler<'set-last-online'> = async (
  _,
  auth
) => {
  if (!auth || !auth.uid) return

  const pg = createSupabaseDirectClient()
  const result = await pg.none(`
              INSERT INTO user_activity (user_id, last_online_time)
              VALUES ($1, now())
              ON CONFLICT (user_id)
                  DO UPDATE
                  SET last_online_time = EXCLUDED.last_online_time
              WHERE user_activity.last_online_time < now() - interval '1 minute';
    `,
    [auth.uid]
  )
  console.log('setLastOnline', result)
}
