import {APIError, APIHandler} from 'api/helpers/endpoint'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'

export const createEvent: APIHandler<'create-event'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  // Validate location
  if (body.locationType === 'in_person' && !body.locationAddress) {
    throw new APIError(400, 'In-person events require a location address')
  }
  if (body.locationType === 'online' && !body.locationUrl) {
    throw new APIError(400, 'Online events require a location URL')
  }

  // Validate dates
  const startTime = new Date(body.eventStartTime)
  if (startTime < new Date()) {
    throw new APIError(400, 'Event start time must be in the future')
  }

  if (body.eventEndTime) {
    const endTime = new Date(body.eventEndTime)
    if (endTime <= startTime) {
      throw new APIError(400, 'Event end time must be after start time')
    }
  }

  const {data, error} = await tryCatch(
    insert(pg, 'events', {
      creator_id: auth.uid,
      title: body.title,
      description: body.description,
      location_type: body.locationType,
      location_address: body.locationAddress,
      location_url: body.locationUrl,
      event_start_time: body.eventStartTime,
      event_end_time: body.eventEndTime,
      max_participants: body.maxParticipants,
    }),
  )

  if (error) {
    throw new APIError(500, 'Failed to create event: ' + error.message)
  }

  return {success: true, event: data}
}
