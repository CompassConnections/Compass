import {APIError, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {trackPublicEvent} from 'shared/analytics'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updateUser} from 'shared/supabase/users'
import {log} from 'shared/utils'

export const banUser: APIHandler<'ban-user'> = async (body, auth) => {
  const {userId, unban} = body
  const db = createSupabaseDirectClient()
  await throwErrorIfNotMod(auth.uid)
  if (isAdminId(userId)) throw new APIError(403, 'Cannot ban admin')
  await trackPublicEvent(auth.uid, 'ban user', {
    userId,
  })
  await updateUser(db, userId, {
    isBannedFromPosting: !unban,
  })
  log('updated user')
}
