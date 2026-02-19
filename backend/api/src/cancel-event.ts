import {APIError, APIHandler} from 'api/helpers/endpoint'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {update} from 'shared/supabase/utils'

export const cancelEvent: APIHandler<'cancel-event'> = async (body, auth) => {
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
    [body.eventId],
  )

  if (!event) {
    throw new APIError(404, 'Event not found')
  }

  if (event.creator_id !== auth.uid) {
    throw new APIError(403, 'Only the event creator can cancel this event')
  }

  if (event.status === 'cancelled') {
    throw new APIError(400, 'Event is already cancelled')
  }

  // Update event status to cancelled
  const {error} = await tryCatch(
    update(pg, 'events', 'id', {
      status: 'cancelled',
      id: body.eventId,
    }),
  )

  if (error) {
    throw new APIError(500, 'Failed to cancel event: ' + error.message)
  }

  return {success: true}
}
