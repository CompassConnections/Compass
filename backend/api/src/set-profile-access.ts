import {assertCanInteract} from 'api/helpers/blocks'
import {APIErrors, type APIHandler} from 'api/helpers/endpoint'
import {
  getProfileAccessRow,
  haveConversation,
  notifyProfileAccess,
  REQUEST_AGAIN_AFTER_DAYS,
} from 'api/helpers/profile-access'
import {DAY_MS} from 'common/util/time'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

/**
 * The owner's side of an approval: let `userId` see the fields kept for approved people ("add to my
 * circle"), take that back, or set a pending request aside.
 *
 * - `approve` needs a reason to exist between the two: the other person asked, was in the circle
 *   before, or the two have a conversation. Nobody can be added — and so notified and pushed — by
 *   a stranger. The other person is told the first time, and not again when they are re-added
 *   shortly after being removed, so add/remove cannot be looped into a stream of messages. The
 *   email goes out only as the answer to their own request; an addition they did not ask for is
 *   an in-app notification and a push.
 * - `revoke` marks the row `removed`. Immediate, and silent.
 * - `dismiss` leaves a pending request in place with `decided_time` set, which hides it from the
 *   owner's list while looking unchanged to the requester — declining carries no social cost.
 */
export const setProfileAccess: APIHandler<'set-profile-access'> = async (
  {userId: viewerId, action},
  auth,
) => {
  if (viewerId === auth.uid) throw APIErrors.badRequest('This is your own profile')
  const pg = createSupabaseDirectClient()

  if (action === 'revoke') {
    // Kept as `removed` rather than deleted: see `approve` below, and the migration.
    await pg.none(
      `update profile_access set status = 'removed', decided_time = now()
       where owner_id = $1 and viewer_id = $2 and status = 'approved'`,
      [auth.uid, viewerId],
    )
    return {status: 'none' as const}
  }

  if (action === 'dismiss') {
    await pg.none(
      `update profile_access set decided_time = now()
       where owner_id = $1 and viewer_id = $2 and status = 'requested' and decided_time is null`,
      [auth.uid, viewerId],
    )
    return {status: 'none' as const}
  }

  // A made-up id would otherwise fail on the foreign key and come back as a 500.
  if (!(await getUser(viewerId))) throw APIErrors.notFound('This member does not exist')
  await assertCanInteract(auth.uid, [viewerId])

  const existing = await getProfileAccessRow(auth.uid, viewerId)
  if (existing?.status === 'approved') return {status: 'approved' as const}

  if (!existing && !(await haveConversation(auth.uid, viewerId))) {
    throw APIErrors.forbidden(
      'You can add someone to your circle once you two have a conversation going, or when they ask',
    )
  }

  await pg.none(
    `insert into profile_access (owner_id, viewer_id, status, decided_time)
     values ($1, $2, 'approved', now())
     on conflict (owner_id, viewer_id)
       do update set status = 'approved', decided_time = now()`,
    [auth.uid, viewerId],
  )

  // Told when it is news: a first addition, an answer to their request, or a return after a long
  // while. Not when they were removed moments ago and are being put back.
  const removedAt =
    existing?.status === 'removed' && existing.decided_time
      ? new Date(existing.decided_time).getTime()
      : null
  const recentlyRemoved =
    removedAt != null && Date.now() - removedAt < REQUEST_AGAIN_AFTER_DAYS * DAY_MS
  // Before the response for the same reason as in `request-profile-access`.
  if (!recentlyRemoved) {
    await notifyProfileAccess('approved', auth.uid, viewerId, {
      // An email only answers a request: nobody is emailed about a circle they did not ask to join.
      email: existing?.status === 'requested',
    })
  }

  return {status: 'approved' as const}
}
