import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const stats: APIHandler<'stats'> = async (_, _auth) => {
  const pg = createSupabaseDirectClient()

  const [userCount, profileCount, eventsCount] = await Promise.all([
    pg.one(`SELECT COUNT(*)::int as count FROM users`),
    pg.one(`SELECT COUNT(*)::int as count FROM profiles`),
    pg.one(`SELECT COUNT(*)::int as count FROM events WHERE event_start_time > now()`),
  ])

  return {
    users: userCount.count,
    profiles: profileCount.count,
    upcomingEvents: eventsCount.count,
  }
}
