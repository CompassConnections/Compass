import {createSupabaseDirectClient} from 'shared/supabase/init'
import {APIError, APIHandler} from './helpers/endpoint'
import {createProfileLikeNotification} from 'shared/create-profile-notification'
import {getHasFreeLike} from './has-free-like'
import {log} from 'shared/utils'
import {tryCatch} from 'common/util/try-catch'
import {Row} from 'common/supabase/utils'

export const likeProfile: APIHandler<'like-profile'> = async (props, auth) => {
  const {targetUserId, remove} = props
  const creatorId = auth.uid

  const pg = createSupabaseDirectClient()

  if (remove) {
    const {error} = await tryCatch(
      pg.none('delete from profile_likes where creator_id = $1 and target_id = $2', [
        creatorId,
        targetUserId,
      ]),
    )

    if (error) {
      throw new APIError(500, 'Failed to remove like: ' + error.message)
    }
    return {status: 'success'}
  }

  // Check if like already exists
  const {data: existing} = await tryCatch(
    pg.oneOrNone<Row<'profile_likes'>>(
      'select * from profile_likes where creator_id = $1 and target_id = $2',
      [creatorId, targetUserId],
    ),
  )

  if (existing) {
    log('Like already exists, do nothing')
    return {status: 'success'}
  }

  const hasFreeLike = await getHasFreeLike(creatorId)

  if (!hasFreeLike) {
    // Charge for like.
    throw new APIError(403, 'You already liked someone today!')
  }

  // Insert the new like
  const {data, error} = await tryCatch(
    pg.one<Row<'profile_likes'>>(
      'insert into profile_likes (creator_id, target_id) values ($1, $2) returning *',
      [creatorId, targetUserId],
    ),
  )

  if (error) {
    throw new APIError(500, 'Failed to add like: ' + error.message)
  }

  const continuation = async () => {
    await createProfileLikeNotification(data)
  }

  return {
    result: {status: 'success'},
    continue: continuation,
  }
}
