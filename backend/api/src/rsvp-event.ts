import {APIError, APIHandler} from 'api/helpers/endpoint'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert, update} from 'shared/supabase/utils'

export const rsvpEvent: APIHandler<'rsvp-event'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  // Check if event exists and is active
  const event = await pg.oneOrNone<{
    id: string
    status: string
    max_participants: number | null
  }>(
    `SELECT id, status, max_participants
     FROM events
     WHERE id = $1`,
    [body.eventId],
  )

  if (!event) {
    throw new APIError(404, 'Event not found')
  }

  if (event.status !== 'active') {
    throw new APIError(400, 'Cannot RSVP to a cancelled or completed event')
  }

  // Check if already RSVPed
  const existingRsvp = await pg.oneOrNone<{
    id: string
  }>(
    `SELECT id
     FROM events_participants
     WHERE event_id = $1
       AND user_id = $2`,
    [body.eventId, auth.uid],
  )

  if (existingRsvp) {
    // Update existing RSVP
    const {error} = await tryCatch(
      update(pg, 'events_participants', 'id', {
        status: body.status,
        id: existingRsvp.id,
      }),
    )

    if (error) {
      throw new APIError(500, 'Failed to update RSVP: ' + error.message)
    }
  } else {
    // Check max participants limit
    if (event.max_participants && body.status === 'going') {
      const count = await pg.one<{count: number}>(
        `SELECT COUNT(*)
         FROM events_participants
         WHERE event_id = $1
           AND status = 'going'`,
        [body.eventId],
      )

      if (Number(count.count) >= event.max_participants) {
        throw new APIError(400, 'Event is at maximum capacity')
      }
    }

    // Create new RSVP
    const {error} = await tryCatch(
      insert(pg, 'events_participants', {
        event_id: body.eventId,
        user_id: auth.uid,
        status: body.status,
      }),
    )

    if (error) {
      throw new APIError(500, 'Failed to RSVP: ' + error.message)
    }
  }

  return {success: true}
}
