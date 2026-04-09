import {APIErrors, type APIHandler} from 'api/helpers/endpoint'
import {tryCatch} from 'common/util/try-catch'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'

export const removePinnedPhoto: APIHandler<'remove-pinned-photo'> = async (
  body: {userId: string},
  auth,
) => {
  const {userId} = body
  log('remove pinned url', {userId})

  await throwErrorIfNotMod(auth.uid)

  const pg = createSupabaseDirectClient()
  const {error} = await tryCatch(
    pg.none('update profiles set pinned_url = null where user_id = $1', [userId]),
  )

  if (error) {
    throw APIErrors.internalServerError('Failed to remove pinned photo')
  }

  return {
    success: true,
  }
}
