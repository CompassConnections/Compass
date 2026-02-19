import {createSupabaseDirectClient} from 'shared/supabase/init'
import {APIError, APIHandler} from './helpers/endpoint'
import {createProfileShipNotification} from 'shared/create-profile-notification'
import {log} from 'shared/utils'
import {tryCatch} from 'common/util/try-catch'
import {insert} from 'shared/supabase/utils'

export const shipProfiles: APIHandler<'ship-profiles'> = async (props, auth) => {
  const {targetUserId1, targetUserId2, remove} = props
  const creatorId = auth.uid

  const pg = createSupabaseDirectClient()

  // Check if ship already exists or with swapped target IDs
  const existing = await tryCatch(
    pg.oneOrNone<{ship_id: string}>(
      `select ship_id from profile_ships
      where creator_id = $1
      and (
        target1_id = $2 and target2_id = $3
        or target1_id = $3 and target2_id = $2
      )`,
      [creatorId, targetUserId1, targetUserId2],
    ),
  )

  if (existing.error) throw new APIError(500, 'Error when checking ship: ' + existing.error.message)

  if (existing.data) {
    if (remove) {
      const {error} = await tryCatch(
        pg.none('delete from profile_ships where ship_id = $1', [existing.data.ship_id]),
      )
      if (error) {
        throw new APIError(500, 'Failed to remove ship: ' + error.message)
      }
    } else {
      log('Ship already exists, do nothing')
    }
    return {status: 'success'}
  }

  // Insert the new ship
  const {data, error} = await tryCatch(
    insert(pg, 'profile_ships', {
      creator_id: creatorId,
      target1_id: targetUserId1,
      target2_id: targetUserId2,
    }),
  )

  if (error) {
    throw new APIError(500, 'Failed to create ship: ' + error.message)
  }

  const continuation = async () => {
    await Promise.all([
      createProfileShipNotification(data, data.target1_id),
      createProfileShipNotification(data, data.target2_id),
    ])
  }

  return {
    result: {status: 'success'},
    continue: continuation,
  }
}
