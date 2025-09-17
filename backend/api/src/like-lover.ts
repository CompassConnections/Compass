import { createSupabaseDirectClient } from 'shared/supabase/init'
import { APIError, APIHandler } from './helpers/endpoint'
import { createLoveLikeNotification } from 'shared/create-love-notification'
import { getHasFreeLike } from './has-free-like'
import { log } from 'shared/utils'
import { tryCatch } from 'common/util/try-catch'
import { Row } from 'common/supabase/utils'

export const likeProfile: APIHandler<'like-lover'> = async (props, auth) => {
  const { targetUserId, remove } = props
  const creatorId = auth.uid

  const pg = createSupabaseDirectClient()

  if (remove) {
    const { error } = await tryCatch(
      pg.none(
        'delete from love_likes where creator_id = $1 and target_id = $2',
        [creatorId, targetUserId]
      )
    )

    if (error) {
      throw new APIError(500, 'Failed to remove like: ' + error.message)
    }
    return { status: 'success' }
  }

  // Check if like already exists
  const { data: existing } = await tryCatch(
    pg.oneOrNone<Row<'love_likes'>>(
      'select * from love_likes where creator_id = $1 and target_id = $2',
      [creatorId, targetUserId]
    )
  )

  if (existing) {
    log('Like already exists, do nothing')
    return { status: 'success' }
  }

  const hasFreeLike = await getHasFreeLike(creatorId)

  if (!hasFreeLike) {
    // Charge for like.
    throw new APIError(403, 'You already liked someone today!')
  }

  // Insert the new like
  const { data, error } = await tryCatch(
    pg.one<Row<'love_likes'>>(
      'insert into love_likes (creator_id, target_id) values ($1, $2) returning *',
      [creatorId, targetUserId]
    )
  )

  if (error) {
    throw new APIError(500, 'Failed to add like: ' + error.message)
  }

  const continuation = async () => {
    await createLoveLikeNotification(data)
  }

  return {
    result: { status: 'success' },
    continue: continuation,
  }
}
