import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {sendDiscordMessage} from 'common/discord/core'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'

export const createEvent: APIHandler<'create-event'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  // Validate location
  if (body.locationType === 'in_person' && !body.locationAddress) {
    throw APIErrors.badRequest('In-person events require a location address')
  }
  if (body.locationType === 'online' && !body.locationUrl) {
    throw APIErrors.badRequest('Online events require a location URL')
  }

  // Validate dates
  const startTime = new Date(body.eventStartTime)
  if (startTime < new Date()) {
    throw APIErrors.badRequest('Event start time must be in the future')
  }

  if (body.eventEndTime) {
    const endTime = new Date(body.eventEndTime)
    if (endTime <= startTime) {
      throw APIErrors.badRequest('Event end time must be after start time')
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
    throw APIErrors.internalServerError('Failed to create event: ' + error.message)
  }

  const continuation = async () => {
    try {
      const user = await pg.oneOrNone(`select name from users where id = $1 `, [auth.uid])
      const message: string = `${user.name} created a new [event](${DEPLOYED_WEB_URL}/events)!\n**${body.title}**\n${body.description}\nStart: ${body.eventStartTime.replace('T', ' @ ').replace('.000Z', ' UTC')}`
      await sendDiscordMessage(message, 'general')
    } catch (e) {
      console.error('Failed to send discord event', e)
    }
  }

  return {
    result: {
      success: true,
      event: data,
    },
    continue: continuation,
  }
}
