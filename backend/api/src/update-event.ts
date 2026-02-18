import {APIError, APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {update} from 'shared/supabase/utils'
import {tryCatch} from 'common/util/try-catch'

export const updateEvent: APIHandler<'update-event'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  // Check if event exists and user is the creator
  const event = await pg.oneOrNone<{
    id: string
    creator_id: string
    status: string
  }>(
    `SELECT id, creator_id, status
     FROM events
     WHERE id = $1`,
    [body.eventId]
  )

  if (!event) {
    throw new APIError(404, 'Event not found')
  }

  if (event.creator_id !== auth.uid) {
    throw new APIError(403, 'Only the event creator can edit this event')
  }

  if (event.status !== 'active') {
    throw new APIError(400, 'Cannot edit a cancelled or completed event')
  }

  // Update event
  const {error} = await tryCatch(
    update(pg, 'events', 'id', {
      title: body.title,
      description: body.description,
      location_type: body.locationType,
      location_address: body.locationAddress,
      location_url: body.locationUrl,
      event_start_time: body.eventStartTime,
      event_end_time: body.eventEndTime,
      max_participants: body.maxParticipants,
      id: body.eventId,
    })
  )

  if (error) {
    throw new APIError(500, 'Failed to update event: ' + error.message)
  }

  return {success: true}
}
