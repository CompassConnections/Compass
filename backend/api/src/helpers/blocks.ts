import {APIErrors, assertCanWrite} from 'api/helpers/endpoint'
import {filterDefined} from 'common/util/array'
import {getPrivateUser, getUser} from 'shared/utils'

/**
 * The guard for every write that reaches another member — a like, a ship, a star, a declared
 * interest: the writer exists and is not banned (`assertCanWrite`), and no block stands between
 * them and anyone the write names (`assertNotBlocked`). Messaging and comments run the same two
 * checks through their own validators; this is the one-liner for the handlers that have nothing
 * else to validate. A blocked member could otherwise keep liking the person who blocked them, and
 * each like notified that person.
 */
export const assertCanInteract = async (userId: string, otherIds: string[]) => {
  const user = await getUser(userId)
  if (!user) throw APIErrors.unauthorized('Your account was not found')
  assertCanWrite(user)
  await assertNotBlocked(userId, otherIds)
}

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
