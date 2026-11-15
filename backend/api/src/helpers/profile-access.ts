import {Notification} from 'common/notifications'
import {sendCircleEmail} from 'email/functions/helpers'
import {createT} from 'shared/locale'
import {sendMobileNotifications, sendWebNotifications} from 'shared/mobile'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser, getUser} from 'shared/utils'

/**
 * How long after an owner has silently declined a request the same member may ask again. A decline
 * leaves the row in place as `requested` with `decided_time` set, so until this has passed a second
 * click changes nothing and tells the requester nothing (docs/profile-visibility.md).
 */
export const REQUEST_AGAIN_AFTER_DAYS = 30

export type ProfileAccessRow = {
  owner_id: string
  viewer_id: string
  /** `removed`: was in the circle and was taken out. Counts as not in it; kept so a re-add is quiet. */
  status: 'requested' | 'approved' | 'removed'
  created_time: Date
  decided_time: Date | null
}

/**
 * Whether `ownerId` has written to `viewerId` in a conversation between just the two of them.
 *
 * This is what opens the door to *asking*: a member may request access only from someone who has
 * already talked to them. It is the owner's own act — being messaged by a stranger does not count,
 * and neither does sharing a group conversation — so nobody can be pinged with requests by people
 * they have never answered. System lines (joins, leaves) are not messages.
 */
export const hasWrittenTo = async (ownerId: string, viewerId: string) => {
  if (ownerId === viewerId) return false
  const row = await createSupabaseDirectClient().oneOrNone(
    `select 1
     from private_user_messages m
     where m.user_id = $1
       and m.visibility = 'private'
       and exists (select 1 from private_user_message_channel_members theirs
                   where theirs.channel_id = m.channel_id and theirs.user_id = $2)
       and (select count(*) from private_user_message_channel_members members
            where members.channel_id = m.channel_id) = 2
     limit 1`,
    [ownerId, viewerId],
  )
  return !!row
}

/** Whether either of the two has written to the other in a conversation between just them. */
export const haveConversation = async (a: string, b: string) =>
  (await hasWrittenTo(a, b)) || (await hasWrittenTo(b, a))

export const getProfileAccessRow = (ownerId: string, viewerId: string) =>
  createSupabaseDirectClient().oneOrNone<ProfileAccessRow>(
    `select * from profile_access where owner_id = $1 and viewer_id = $2`,
    [ownerId, viewerId],
  )

/**
 * Tells the owner about a request, or the viewer about an approval: an in-app notification, an
 * email, and a push to their browsers and phones. A decline and a revoke deliberately raise nothing. Written in
 * the recipient's language here, since the generic notification row renders its `title` as stored.
 *
 * There is no preference of its own for these; they follow the recipient's global opt-outs (in-app
 * under `browser`, email under `email`, push under `mobile`). A failed email or push never fails the
 * request — the in-app row is already written by then.
 */
export const notifyProfileAccess = async (
  kind: 'requested' | 'approved',
  fromUserId: string,
  toUserId: string,
) => {
  const [fromUser, toUser, toPrivateUser] = await Promise.all([
    getUser(fromUserId),
    getUser(toUserId),
    getPrivateUser(toUserId),
  ]).catch((err) => {
    log.error('Failed to load users for a profile-access notification', {err, toUserId})
    return [null, null, null] as const
  })
  if (!fromUser || !toUser || !toPrivateUser) return
  const optOuts = toPrivateUser.notificationPreferences?.opt_out_all ?? []

  const t = createT(toPrivateUser.locale)
  const title =
    kind === 'requested'
      ? t('notifications.profile_access.requested', '{name} asked to join your circle', {
          name: fromUser.name,
        })
      : t('notifications.profile_access.approved', '{name} added you to their circle', {
          name: fromUser.name,
        })

  // What it means, under the title: "circle" is our word, and a notification is where someone may
  // meet it for the first time. The same sentence is the body of the push.
  const body =
    kind === 'requested'
      ? t(
          'notifications.profile_access.requested_body',
          'People in your circle see the parts of your profile you keep for it. Open their profile to add them or ignore the request.',
        )
      : t(
          'notifications.profile_access.approved_body',
          'You can now see the parts of their profile they keep for their circle.',
        )

  const notification: Notification = {
    id: `profile-access-${kind}-${fromUserId}-${toUserId}-${Date.now()}`,
    userId: toUserId,
    reason: 'profile_access',
    createdTime: Date.now(),
    isSeen: false,
    sourceType: 'profile_access',
    sourceUpdateType: 'created',
    sourceUserName: fromUser.name,
    sourceUserUsername: fromUser.username,
    sourceUserAvatarUrl: fromUser.avatarUrl,
    title,
    sourceText: body,
    // The requester's own page is where the owner decides (it shows approve / ignore), and the
    // owner's page is where an approved viewer sees what changed.
    sourceSlug: `/${fromUser.username}`,
    data: {kind},
  }
  // Each channel on its own: the row in `profile_access` is already written when this runs, so a
  // failure here must neither fail the request (a retry would find the row and notify nobody) nor
  // stop the other channels from going out.
  if (!optOuts.includes('browser')) {
    try {
      await insertNotificationToSupabase(notification)
    } catch (err) {
      log.error('Failed to store profile-access notification', {err, toUserId})
    }
  }

  // The email checks its own opt-out, and a failure there must not cost the request either.
  try {
    await sendCircleEmail(
      toPrivateUser,
      fromUser,
      toUser,
      kind === 'requested' ? 'requested' : 'added',
    )
  } catch (err) {
    log.error('Failed to send profile-access email', {err, toUserId})
  }

  if (optOuts.includes('mobile')) return
  const payload = {
    title,
    body,
    url: `/${fromUser.username}`,
    // One per pair and kind, so asking again replaces the earlier push instead of stacking.
    collapseKey: `profile-access-${kind}-${fromUserId}`,
  }
  const pg = createSupabaseDirectClient()
  try {
    await sendWebNotifications(pg, toUserId, JSON.stringify(payload))
  } catch (err) {
    log.error('Failed to send profile-access web push', {err, toUserId})
  }
  try {
    await sendMobileNotifications(pg, toUserId, payload)
  } catch (err) {
    log.error('Failed to send profile-access mobile push', {err, toUserId})
  }
}
