import {APIHandler} from 'api/helpers/endpoint'
import {Notification} from 'common/notifications'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {createT} from 'shared/locale'
import {sendMobileNotifications, sendWebNotifications} from 'shared/mobile'
import {getProfile} from 'shared/profiles/supabase'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser, getUser} from 'shared/utils'

export const updateConnectionInterests: APIHandler<'update-connection-interest'> = async (
  props,
  auth,
) => {
  const {targetUserId, connectionType, seeking} = props
  const pg = createSupabaseDirectClient()

  if (!connectionType) {
    throw new Error('Invalid connection type')
  }

  if (seeking) {
    await pg.query(
      `INSERT INTO connection_interests (user_id, target_user_id, connection_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, target_user_id, connection_type) DO NOTHING`,
      [auth.uid, targetUserId, connectionType],
    )

    const matchingInterest = await pg.oneOrNone(
      `SELECT 1 FROM connection_interests 
       WHERE user_id = $1 AND target_user_id = $2 AND connection_type = $3`,
      [targetUserId, auth.uid, connectionType],
    )

    if (matchingInterest) {
      const targetPrivateUser = await getPrivateUser(targetUserId)
      const currentUser = await getUser(auth.uid)
      const currentUserProfile = await getProfile(auth.uid)

      if (targetPrivateUser && currentUser && currentUserProfile) {
        const {sendToBrowser} = getNotificationDestinationsForUser(
          targetPrivateUser,
          'connection_interest_match',
        )

        if (sendToBrowser) {
          const notification: Notification = {
            id: `${auth.uid}-${targetUserId}-${connectionType}-${Date.now()}`,
            userId: targetUserId,
            reason: 'connection_interest_match',
            createdTime: Date.now(),
            isSeen: false,
            sourceType: 'connection_interest_match',
            sourceUpdateType: 'created',
            sourceUserName: currentUser.name,
            sourceUserUsername: currentUser.username,
            sourceUserAvatarUrl: currentUserProfile.pinned_url ?? currentUser.avatarUrl,
            sourceText: connectionType,
            data: {
              connectionType,
            },
          }
          await insertNotificationToSupabase(notification, pg)
        }

        const t = createT(targetPrivateUser.locale)
        const type = t(`profile.relationship.${connectionType}`, connectionType).toLowerCase()

        const payload = {
          title: t('notifications.connection.mutual_title', 'It’s mutual 🎉'),
          body: t(
            'notifications.connection.mutual_body',
            'You and {name} are both interested in a {type}. Start the conversation.',
            {
              name: currentUser.name,
              type,
            },
          ),
          url: `/${currentUser.username}`,
        }
        try {
          await sendWebNotifications(pg, targetUserId, JSON.stringify(payload))
        } catch (err) {
          console.error('Failed to send web notification:', err)
        }
        try {
          await sendMobileNotifications(pg, targetUserId, payload)
        } catch (err) {
          console.error('Failed to send mobile notification:', err)
        }
      }
    }
  } else {
    await pg.query(
      'DELETE FROM connection_interests WHERE user_id = $1 AND target_user_id = $2 AND connection_type = $3',
      [auth.uid, targetUserId, connectionType],
    )
  }

  return {success: true}
}
