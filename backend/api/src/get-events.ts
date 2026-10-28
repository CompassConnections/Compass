import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getPrivateUser} from 'shared/utils'

/**
 * Public events, split into upcoming and past, with their attendance as the caller may see it.
 *
 * Who is going to an in-person event is not public information on a dating site: it tells anyone
 * with the URL where a given member will be, and when. So the lists of ids come back only to
 * signed-in members, and without anyone the viewer has blocked or been blocked by. Visitors get the
 * counts, which is all the event listing needs to say "12 going". The endpoint stays open because
 * the events page is.
 */
export const getEvents: APIHandler<'get-events'> = async (_props, auth) => {
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
     ORDER BY event_start_time`,
  )

  // Get participants for each event
  const eventIds = events.map((e) => e.id)
  const [participants, viewer] = await Promise.all([
    eventIds.length > 0
      ? pg.manyOrNone<{
          event_id: string
          user_id: string
          status: 'going' | 'maybe' | 'not_going'
        }>(
          `SELECT event_id, user_id, status
       FROM events_participants
       WHERE event_id = ANY ($1)`,
          [eventIds],
        )
      : [],
    auth ? getPrivateUser(auth.uid) : null,
  ])

  // Get creator info for each event
  const creatorIds = [...new Set(events.map((e) => e.creator_id))]
  const creators =
    creatorIds.length > 0
      ? await pg.manyOrNone<{
          id: string
          name: string
          username: string
          avatar_url: string | null
        }>(
          `SELECT id, name, username, avatar_url
       FROM users
       WHERE id = ANY ($1)`,
          [creatorIds],
        )
      : []

  const hiddenFromViewer = new Set([
    ...(viewer?.blockedUserIds ?? []),
    ...(viewer?.blockedByUserIds ?? []),
  ])
  // Ids only for a signed-in viewer, and never those of someone on either side of a block with them.
  const visibleIds = (rows: {user_id: string}[]) =>
    auth ? rows.map((p) => p.user_id).filter((id) => !hiddenFromViewer.has(id)) : []

  const now = new Date()

  const eventsWithDetails = events.map((event) => {
    const going = participants.filter((p) => p.event_id === event.id && p.status === 'going')
    const maybe = participants.filter((p) => p.event_id === event.id && p.status === 'maybe')
    return {
      ...event,
      participants: visibleIds(going),
      maybe: visibleIds(maybe),
      // Counted before the viewer's filter, so the number means the same thing to everyone.
      participantsCount: going.length,
      maybeCount: maybe.length,
      creator: creators.find((c) => c.id === event.creator_id),
    }
  })

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
