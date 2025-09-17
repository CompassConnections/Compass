import { createSupabaseDirectClient } from 'shared/supabase/init'
import { APIError, APIHandler } from './helpers/endpoint'
import { log } from 'shared/utils'
import { tryCatch } from 'common/util/try-catch'
import { Row } from 'common/supabase/utils'
import { insert } from 'shared/supabase/utils'

export const starProfile: APIHandler<'star-lover'> = async (props, auth) => {
  const { targetUserId, remove } = props
  const creatorId = auth.uid

  const pg = createSupabaseDirectClient()

  if (remove) {
    const { error } = await tryCatch(
      pg.none(
        'delete from love_stars where creator_id = $1 and target_id = $2',
        [creatorId, targetUserId]
      )
    )

    if (error) {
      throw new APIError(500, 'Failed to remove star: ' + error.message)
    }
    return { status: 'success' }
  }

  // Check if star already exists
  const { data: existing } = await tryCatch(
    pg.oneOrNone<Row<'love_stars'>>(
      'select * from love_stars where creator_id = $1 and target_id = $2',
      [creatorId, targetUserId]
    )
  )

  if (existing) {
    log('star already exists, do nothing')
    return { status: 'success' }
  }

  // Insert the new star
  const { error } = await tryCatch(
    insert(pg, 'love_stars', { creator_id: creatorId, target_id: targetUserId })
  )

  if (error) {
    throw new APIError(500, 'Failed to add star: ' + error.message)
  }

  return { status: 'success' }
}
