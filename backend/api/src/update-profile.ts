import { APIError, APIHandler } from 'api/helpers/endpoint'
import { removePinnedUrlFromPhotoUrls } from 'shared/profiles/parse-photos'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { updateUser } from 'shared/supabase/users'
import { log } from 'shared/utils'
import { tryCatch } from 'common/util/try-catch'
import { update } from 'shared/supabase/utils'
import { type Row } from 'common/supabase/utils'

export const updateProfile: APIHandler<'update-profile'> = async (
  parsedBody,
  auth
) => {
  log('parsedBody', parsedBody)
  const pg = createSupabaseDirectClient()

  const { data: existingProfile } = await tryCatch(
    pg.oneOrNone<Row<'profiles'>>('select * from profiles where user_id = $1', [
      auth.uid,
    ])
  )

  if (!existingProfile) {
    throw new APIError(404, 'Profile not found')
  }

  log('Updating profile', { userId: auth.uid, parsedBody })

  await removePinnedUrlFromPhotoUrls(parsedBody)
  if (parsedBody.avatar_url) {
    await updateUser(pg, auth.uid, { avatarUrl: parsedBody.avatar_url })
  }

  const { data, error } = await tryCatch(
    update(pg, 'profiles', 'user_id', { user_id: auth.uid, ...parsedBody })
  )

  if (error) {
    log('Error updating profile', error)
    throw new APIError(500, 'Error updating profile')
  }

  return data
}
