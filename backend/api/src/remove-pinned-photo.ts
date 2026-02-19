import {APIError, type APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'

export const removePinnedPhoto: APIHandler<'remove-pinned-photo'> = async (
  body: {userId: string},
  auth,
) => {
  const {userId} = body
  log('remove pinned url', {userId})

  if (!isAdminId(auth.uid)) throw new APIError(403, 'Only admins can remove pinned photo')

  const pg = createSupabaseDirectClient()
  const {error} = await tryCatch(
    pg.none('update profiles set pinned_url = null where user_id = $1', [userId]),
  )

  if (error) {
    throw new APIError(500, 'Failed to remove pinned photo')
  }

  return {
    success: true,
  }
}
