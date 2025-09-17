import { APIError, APIHandler } from 'api/helpers/endpoint'
import { removePinnedUrlFromPhotoUrls } from 'shared/love/parse-photos'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { updateUser } from 'shared/supabase/users'
import { log } from 'shared/utils'
import { tryCatch } from 'common/util/try-catch'
import { update } from 'shared/supabase/utils'
import { type Row } from 'common/supabase/utils'

export const updateLover: APIHandler<'update-lover'> = async (
  parsedBody,
  auth
) => {
  log('parsedBody', parsedBody)
  const pg = createSupabaseDirectClient()

  const { data: existingLover } = await tryCatch(
    pg.oneOrNone<Row<'profiles'>>('select * from profiles where user_id = $1', [
      auth.uid,
    ])
  )

  if (!existingLover) {
    throw new APIError(404, 'Lover not found')
  }

  !parsedBody.last_online_time &&
    log('Updating lover', { userId: auth.uid, parsedBody })

  await removePinnedUrlFromPhotoUrls(parsedBody)
  if (parsedBody.avatar_url) {
    await updateUser(pg, auth.uid, { avatarUrl: parsedBody.avatar_url })
  }

  const { data, error } = await tryCatch(
    update(pg, 'profiles', 'user_id', { user_id: auth.uid, ...parsedBody })
  )

  if (error) {
    log('Error updating lover', error)
    throw new APIError(500, 'Error updating lover')
  }

  return data
}
