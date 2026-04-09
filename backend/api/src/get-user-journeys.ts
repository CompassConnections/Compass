import {APIHandler} from 'api/helpers/endpoint'
import {convertUser} from 'common/supabase/users'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getUserJourneys: APIHandler<'get-user-journeys'> = async ({hoursFromNow}, auth) => {
  await throwErrorIfNotMod(auth.uid)

  const pg = createSupabaseDirectClient()

  const start = new Date(Date.now() - parseInt(hoursFromNow) * 60 * 60 * 1000)

  // Get users created after start time
  const users = await pg.any('SELECT * FROM users WHERE created_time > $1', [start.toISOString()])

  if (users.length === 0) {
    return {users: [], events: []}
  }

  const userIds = users.map((u) => u.id)

  // Get events for these users
  const events = await pg.any('SELECT * FROM user_events WHERE user_id = ANY($1) ORDER BY ts ASC', [
    userIds,
  ])

  return {
    users: users.map(convertUser),
    events,
  }
}
