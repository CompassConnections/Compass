import {APIErrors} from 'common/api/utils'
import {isAdminId, isModId} from 'common/envs/constants'

export const throwErrorIfNotMod = async (userId: string) => {
  if (!isAdminId(userId) && !isModId(userId)) {
    throw APIErrors.forbidden(`User ${userId} must be an admin or trusted to perform this action.`)
  }
}
