import {Notification} from 'common/notifications'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {sendMobileNotifications} from 'shared/mobile'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser} from 'shared/utils'

export type ReferredMember = {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  joinedTime: string
}

/**
 * Everyone who signed up carrying this member's username as their referrer.
 *
 * Disabled and banned members are still counted. Credit is for the introduction, which happened; what
 * the person did afterwards is not something the referrer should be silently docked for.
 */
export const getReferredMembers = async (
  username: string,
  pg?: SupabaseDirectClient,
): Promise<ReferredMember[]> => {
  pg = pg ?? createSupabaseDirectClient()
  return await pg.manyOrNone<ReferredMember>(
    `select u.id, u.name, u.username, u.avatar_url as "avatarUrl", u.created_time as "joinedTime"
     from profiles p
              join users u on u.id = p.user_id
     where p.referred_by_username = $1
     order by u.created_time desc`,
    [username],
  )
}

/**
 * The member a `referred_by_username` names, or null when it names nobody.
 *
 * `?referrer=` is whatever was in the URL, so the column can hold a username that never existed or one
 * whose account is gone. Every caller has to handle that: crediting a name that resolves to no member
 * is worse than crediting nobody.
 */
export const getReferrer = async (
  username: string,
  pg?: SupabaseDirectClient,
): Promise<{id: string; name: string; username: string} | null> => {
  pg = pg ?? createSupabaseDirectClient()
  return await pg.oneOrNone<{id: string; name: string; username: string}>(
    `select id, name, username from users where username = $1`,
    [username],
  )
}

/**
 * Tell a member that someone they brought has arrived.
 *
 * The gap this closes: `?referrer=` has always been recorded and never surfaced, so bringing someone
 * produced no visible result of any kind. A sharer who is never told it worked has no reason to
 * believe it did, and no reason to do it again — which is most of the difference between a one-time
 * share and a repeat one.
 *
 * Best-effort by design: it is called from the signup continuation, and nothing about a new member's
 * account creation should fail because a notification to a third party could not be written.
 */
export const notifyReferrerOfSignup = async (
  newMember: {name: string; username: string; avatarUrl?: string},
  referrerUsername: string,
  pg?: SupabaseDirectClient,
) => {
  pg = pg ?? createSupabaseDirectClient()

  const referrer = await getReferrer(referrerUsername, pg)
  if (!referrer) return

  const privateUser = await getPrivateUser(referrer.id)
  if (!privateUser) return

  const {sendToBrowser} = getNotificationDestinationsForUser(privateUser, 'platform_updates')
  if (!sendToBrowser) return

  // Need to fix the platform_updates notif setting stuck at ["browser", "email"]
  const sendToMobile = sendToBrowser

  const body = `${newMember.name} joined Compass from your link.`

  if (sendToBrowser) {
    // How many they have brought in total, counted after this signup so it includes them. The bell
    // shows it as "your 3rd introduction" — a single arrival is easy to shrug off, a tally is what
    // makes it read as something they are good at.
    const {count} = await pg.one<{count: string}>(
      `select count(*) from profiles where referred_by_username = $1`,
      [referrerUsername],
    )

    const notification: Notification = {
      id: `referred-joined-${newMember.username}`,
      userId: referrer.id,
      reason: 'referred_member_joined',
      createdTime: Date.now(),
      isSeen: false,
      sourceType: 'referral',
      sourceUpdateType: 'created',
      sourceUserName: newMember.name,
      sourceUserUsername: newMember.username,
      sourceUserAvatarUrl: newMember.avatarUrl,
      sourceText: body,
      isSeenOnHref: '/referrals',
      data: {referredCount: Number(count)},
    }
    await insertNotificationToSupabase(notification, pg)
  }

  console.log({sendToMobile, referrer, privateUser})

  // No collapse key: each arrival is a separate person, and merging them would turn the one moment
  // worth celebrating into a running total. Failure is swallowed — the bell entry is the record, the
  // push is only the nudge to go look at it.
  if (sendToMobile) {
    try {
      await sendMobileNotifications(pg, referrer.id, {
        title: 'Someone joined from your link',
        body,
        url: '/referrals',
      })
    } catch (error) {
      log.error(`Failed to push referral signup to ${referrer.id}`, {error})
    }
  }
}
