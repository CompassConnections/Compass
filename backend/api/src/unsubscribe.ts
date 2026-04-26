import {createSupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'

import {APIHandler} from './helpers/endpoint'

export const unsubscribe: APIHandler<'unsubscribe/:token'> = async ({token}, _auth) => {
  // One-click check: if List-Unsubscribe header is present, it must be "One-Click"
  // if (listUnsubscribe && listUnsubscribe !== 'One-Click') {
  //   throw APIErrors.badRequest('Invalid List-Unsubscribe value')
  // }

  log('Unsubscribe', token)

  const pg = createSupabaseDirectClient()

  // Look up the token and get user info
  const tokenRecord = await pg.oneOrNone<{
    user_id: string
    notification_type: string | null
    used_at: Date | null
  }>(
    `SELECT user_id, notification_type, used_at
     FROM email_unsubscribe_tokens
     WHERE token = $1`,
    [token],
  )

  if (!tokenRecord) {
    // Return success to avoid token probing
    log('Token not found', token)
    return {success: true}
  }

  if (tokenRecord.used_at) {
    // Endpoint must be idempotent
    log('Token already used', token, tokenRecord)
    return {success: true}
  }

  // Mark token as used
  await pg.none(
    `UPDATE email_unsubscribe_tokens
     SET used_at = now()
     WHERE token = $1`,
    [token],
  )

  // Update user's notification preferences to opt out of email
  // If notification_type is specified, only unsubscribe from that type
  // Otherwise, opt out of all email notifications
  const {user_id, notification_type} = tokenRecord

  if (notification_type) {
    // Unsubscribe from specific notification type via email
    await pg.none(
      `UPDATE private_users
       SET data = jsonb_set(
         data,
         '{notificationPreferences,${notification_type}}',
         (COALESCE(data->'notificationPreferences'->'${notification_type}', '["email", "browser", "mobile"]'::jsonb) - 'email')
       )
       WHERE id = $1`,
      [user_id],
    )
  } else {
    // Unsubscribe from all emails by adding email to opt_out_all
    await pg.none(
      `UPDATE private_users
       SET data = jsonb_set(
         data,
         '{notificationPreferences,opt_out_all}',
         COALESCE(data->'notificationPreferences'->'opt_out_all', '[]'::jsonb) || '["email"]'::jsonb
       )
       WHERE id = $1`,
      [user_id],
    )
  }

  return {success: true}
}
