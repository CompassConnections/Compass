import { APIError, APIHandler } from 'api/helpers/endpoint'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { log, getUser } from 'shared/utils'
import { HOUR_MS } from 'common/util/time'
import { removePinnedUrlFromPhotoUrls } from 'shared/love/parse-photos'
import { track } from 'shared/analytics'
import { updateUser } from 'shared/supabase/users'
import { tryCatch } from 'common/util/try-catch'
import { insert } from 'shared/supabase/utils'

export const createProfile: APIHandler<'create-lover'> = async (body, auth) => {
  const pg = createSupabaseDirectClient()

  const { data: existingUser } = await tryCatch(
    pg.oneOrNone<{ id: string }>('select id from profiles where user_id = $1', [
      auth.uid,
    ])
  )
  if (existingUser) {
    throw new APIError(400, 'User already exists')
  }

  await removePinnedUrlFromPhotoUrls(body)
  const user = await getUser(auth.uid)
  if (!user) throw new APIError(401, 'Your account was not found')
  if (user.createdTime > Date.now() - HOUR_MS) {
    // If they just signed up, set their avatar to be their pinned photo
    updateUser(pg, auth.uid, { avatarUrl: body.pinned_url })
  }

  console.log('body', body)

  const { data, error } = await tryCatch(
    insert(pg, 'profiles', { user_id: auth.uid, ...body })
  )

  if (error) {
    log.error('Error creating user: ' + error.message)
    throw new APIError(500, 'Error creating user')
  }

  log('Created user', data)
  await track(user.id, 'create lover', { username: user.username })

  return data
}
