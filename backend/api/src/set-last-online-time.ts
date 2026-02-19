import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const setLastOnlineTime: APIHandler<'set-last-online-time'> = async (_, auth) => {
  if (!auth || !auth.uid) return
  await setLastOnlineTimeUser(auth.uid)
  // console.log('setLastOnline')
}

export const setLastOnlineTimeUser = async (userId: string) => {
  const pg = createSupabaseDirectClient()
  await pg.none(
    `
              INSERT INTO user_activity (user_id, last_online_time)
              VALUES ($1, now())
              ON CONFLICT (user_id)
                  DO UPDATE
                  SET last_online_time = EXCLUDED.last_online_time
              WHERE user_activity.last_online_time < now() - interval '1 minute';
    `,
    [userId],
  )
}
