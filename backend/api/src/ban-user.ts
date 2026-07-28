import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {trackPublicEvent} from 'shared/analytics'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {updateUser} from 'shared/supabase/users'
import {log} from 'shared/utils'

export const banUser: APIHandler<'ban-user'> = async (body, auth) => {
  const {userId, unban, reason} = body
  await throwErrorIfNotMod(auth.uid)
  if (isAdminId(userId)) throw APIErrors.forbidden('Cannot ban admin')
  // The reason is what the banned member is shown, so it defaults to the provisional hold: telling
  // someone their account is permanently closed has to be a deliberate choice, never a default.
  const banReason = unban ? null : (reason ?? 'under_review')
  await trackPublicEvent(auth.uid, 'ban user', {
    userId,
    reason: banReason,
  })
  await updateUser(userId, {isBannedFromPosting: !unban, banReason})
  log('updated user')
}
