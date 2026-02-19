import {APIError, APIHandler} from 'api/helpers/endpoint'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const cancelRsvp: APIHandler<'cancel-rsvp'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  // Check if RSVP exists
  const rsvp = await pg.oneOrNone<{
    id: string
  }>(
    `SELECT id
     FROM events_participants
     WHERE event_id = $1
       AND user_id = $2`,
    [body.eventId, auth.uid],
  )

  if (!rsvp) {
    throw new APIError(404, 'RSVP not found')
  }

  // Delete the RSVP
  const {error} = await tryCatch(
    pg.none(
      `DELETE
       FROM events_participants
       WHERE id = $1`,
      [rsvp.id],
    ),
  )

  if (error) {
    throw new APIError(500, 'Failed to cancel RSVP: ' + error.message)
  }

  return {success: true}
}
