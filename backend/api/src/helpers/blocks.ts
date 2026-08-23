import {APIErrors} from 'api/helpers/endpoint'
import {filterDefined} from 'common/util/array'
import {getPrivateUser} from 'shared/utils'

/**
 * Blocking is enforced **symmetrically**: once either side has blocked the other, neither can reach
 * the other. The stored data is one-directional (`blockedUserIds` on the blocker, `blockedByUserIds`
 * on the blocked) but the enforcement is not — a blocker who could still message the person they
 * blocked would be using the block as a one-way mute, which is not what the button promises.
 *
 * `blockedByUserIds` is deliberately not consulted here. It is a denormalised mirror maintained by
 * `block-user.ts` for cheap client-side checks; the authoritative fact is the blocker's own
 * `blockedUserIds`, so reading that on both users cannot go stale relative to itself.
 */
export const isBlockedBetween = async (userId: string, otherIds: string[]) => {
  const ids = otherIds.filter((id) => id !== userId)
  if (!ids.length) return false

  const [self, others] = await Promise.all([
    getPrivateUser(userId),
    Promise.all(ids.map((id) => getPrivateUser(id))).then(filterDefined),
  ])

  const iBlockedThem = (self?.blockedUserIds ?? []).some((id) => ids.includes(id))
  const theyBlockedMe = others.some((u) => (u.blockedUserIds ?? []).includes(userId))

  return iBlockedThem || theyBlockedMe
}

/** `isBlockedBetween`, as a guard. The message is deliberately vague about which way the block runs. */
export const assertNotBlocked = async (userId: string, otherIds: string[]) => {
  if (await isBlockedBetween(userId, otherIds)) {
    throw APIErrors.forbidden('You can no longer interact with this person')
  }
}
