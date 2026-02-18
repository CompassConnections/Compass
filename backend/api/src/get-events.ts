import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getEvents: APIHandler<'get-events'> = async () => {
  const pg = createSupabaseDirectClient()

  const events = await pg.manyOrNone<{
    id: string
    created_time: string
    creator_id: string
    title: string
    description: string | null
    location_type: 'in_person' | 'online'
    location_address: string | null
    location_url: string | null
    event_start_time: object
    event_end_time: object | null
    is_public: boolean
    max_participants: number | null
    status: 'active' | 'cancelled' | 'completed'
  }>(
    `SELECT *
     FROM events
     WHERE is_public = true
       AND status = 'active'
     ORDER BY event_start_time`
  )

  // Get participants for each event
  const eventIds = events.map(e => e.id)
  const participants = eventIds.length > 0
    ? await pg.manyOrNone<{
      event_id: string
      user_id: string
      status: 'going' | 'maybe' | 'not_going'
    }>(
      `SELECT event_id, user_id, status
       FROM events_participants
       WHERE event_id = ANY ($1)`,
      [eventIds]
    )
    : []

  // Get creator info for each event
  const creatorIds = [...new Set(events.map(e => e.creator_id))]
  const creators = creatorIds.length > 0
    ? await pg.manyOrNone<{
      id: string
      name: string
      username: string
      avatar_url: string | null
    }>(
      `SELECT id, name, username, data ->> 'avatarUrl' as avatar_url
       FROM users
       WHERE id = ANY ($1)`,
      [creatorIds]
    )
    : []

  const now = new Date()

  const eventsWithDetails = events.map(event => ({
    ...event,
    participants: participants
      .filter(p => p.event_id === event.id && p.status === 'going')
      .map(p => p.user_id),
    maybe: participants
      .filter(p => p.event_id === event.id && p.status === 'maybe')
      .map(p => p.user_id),
    creator: creators.find(c => c.id === event.creator_id),
  }))

  const upcoming: typeof eventsWithDetails = []
  const past: typeof eventsWithDetails = []

  for (const e of eventsWithDetails) {
    if ((e.event_end_time ?? e.event_start_time) > now) {
      upcoming.push(e)
    } else {
      past.push(e)
    }
  }

  // console.debug({events, eventsWithDetails, upcoming, past, now})

  return {upcoming, past}
}
