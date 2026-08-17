import {APIErrors} from 'common/api/utils'
import {isAdminId, isModId} from 'common/envs/constants'

export const throwErrorIfNotMod = async (userId: string) => {
  if (!isAdminId(userId) && !isModId(userId)) {
    throw APIErrors.forbidden(`User ${userId} must be an admin or trusted to perform this action.`)
  }
}

/**
 * Stricter than `throwErrorIfNotMod` — admins only, no mods.
 *
 * For actions that publish something about a member to the logged-out world rather than moderate
 * something a member published themselves. Member spotlights are the first of these: the mod role
 * exists to take content down, and putting a real person's face and words on the front page is a
 * different kind of decision from that.
 */
export const throwErrorIfNotAdmin = async (userId: string) => {
  if (!isAdminId(userId)) {
    throw APIErrors.forbidden(`User ${userId} must be an admin to perform this action.`)
  }
}
