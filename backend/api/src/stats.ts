import {getMessagesCount} from 'api/get-messages-count'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const stats: APIHandler<'stats'> = async (_, _auth) => {
  const pg = createSupabaseDirectClient()

  const [userCount, profileCount, eventsCount, messagesCount] = await Promise.all([
    pg.one(`SELECT COUNT(*)::int as count FROM users`),
    pg.one(`SELECT COUNT(*)::int as count FROM profiles`),
    pg.one(`SELECT COUNT(*)::int as count FROM events WHERE event_start_time > now()`),
    getMessagesCount(),
  ])

  return {
    users: userCount.count,
    profiles: profileCount.count,
    upcomingEvents: eventsCount.count,
    messages: messagesCount.count,
  }
}
