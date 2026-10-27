import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {trackPublicEvent} from 'shared/analytics'
import {throwErrorIfNotMod} from 'shared/helpers/auth'
import {addBannedNetworksOf, removeBannedNetworksOf} from 'shared/moderation/banned-networks'
import {createSupabaseDirectClient} from 'shared/supabase/init'
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
  // A confirmed abuser's signup IP and device are blocked for new signups; anything short of that
  // (unban, or downgraded back to a provisional hold) takes them off the list again.
  const pg = createSupabaseDirectClient()
  if (banReason === 'confirmed_abuse') await addBannedNetworksOf(pg, userId)
  else await removeBannedNetworksOf(pg, userId)
}
