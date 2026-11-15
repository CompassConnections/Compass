import {assertCanInteract} from 'api/helpers/blocks'
import {APIErrors, type APIHandler} from 'api/helpers/endpoint'
import {
  getProfileAccessRow,
  hasWrittenTo,
  notifyProfileAccess,
  REQUEST_AGAIN_AFTER_DAYS,
} from 'api/helpers/profile-access'
import {parseFieldVisibility} from 'common/profiles/visibility'
import {DAY_MS} from 'common/util/time'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Ask another member to approve you for the fields they keep for approved people. Only possible once
 * that member has written to you (`hasWrittenTo`): requests cannot be sent to strangers.
 *
 * Always answers `requested` (or `approved` when it already is), whatever happened: a request the
 * owner has silently declined looks exactly like one still waiting, and asking again inside the
 * waiting period changes nothing and notifies nobody. Only a first request, or one made after the
 * period has passed, reaches the owner.
 */
export const requestProfileAccess: APIHandler<'request-profile-access'> = async (
  {userId: ownerId},
  auth,
) => {
  if (ownerId === auth.uid) throw APIErrors.badRequest('This is your own profile')
  await assertCanInteract(auth.uid, [ownerId])

  const pg = createSupabaseDirectClient()
  const owner = await pg.oneOrNone<{field_visibility: unknown; disabled: boolean}>(
    `select field_visibility, disabled from profiles where user_id = $1`,
    [ownerId],
  )
  // Nothing to ask for. The button is only shown when there is, so this is a stale page or a
  // hand-written request; it is refused rather than stored, so nobody collects requests they never
  // invited.
  const keepsSomething = Object.values(parseFieldVisibility(owner?.field_visibility)).includes(
    'connected',
  )
  if (!owner || owner.disabled || !keepsSomething) {
    throw APIErrors.badRequest('This member is not taking requests')
  }

  const existing = await getProfileAccessRow(ownerId, auth.uid)
  if (existing?.status === 'approved') return {status: 'approved' as const}

  // Only from someone who has already written to you. The page says so instead of offering the
  // button, so this is the same rule again for a request made without the page.
  if (!(await hasWrittenTo(ownerId, auth.uid))) {
    throw APIErrors.forbidden(
      'You can ask once this member has written to you in a conversation between the two of you',
    )
  }

  if (existing) {
    // Someone who was removed from the circle and asks again is treated as a declined request: the
    // row becomes a request that is already set aside (its `decided_time` is the removal), so it
    // looks pending to them and reaches the owner only once the waiting period has passed.
    if (existing.status === 'removed') {
      await pg.none(
        `update profile_access set status = 'requested'
         where owner_id = $1 and viewer_id = $2 and status = 'removed'`,
        [ownerId, auth.uid],
      )
    }
    const declinedAt = existing.decided_time ? new Date(existing.decided_time).getTime() : null
    const mayAskAgain =
      declinedAt != null && Date.now() - declinedAt > REQUEST_AGAIN_AFTER_DAYS * DAY_MS
    if (!mayAskAgain) return {status: 'requested' as const}
    await pg.none(
      `update profile_access set created_time = now(), decided_time = null
       where owner_id = $1 and viewer_id = $2 and status = 'requested'`,
      [ownerId, auth.uid],
    )
  } else {
    await pg.none(
      `insert into profile_access (owner_id, viewer_id, status)
       values ($1, $2, 'requested')
       on conflict (owner_id, viewer_id) do nothing`,
      [ownerId, auth.uid],
    )
  }

  // Before the response, not in a `continue`: Cloud Run throttles the CPU once the response is sent,
  // and a request the owner never hears about is the whole feature failing quietly.
  await notifyProfileAccess('requested', auth.uid, ownerId)

  return {status: 'requested' as const}
}
