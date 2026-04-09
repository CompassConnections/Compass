import {PROD_CONFIG} from 'common/envs/prod'
import {notification_preference} from 'common/user-notification-preferences'
import crypto from 'crypto'

import {createSupabaseDirectClient, SupabaseDirectClient} from './supabase/init'

/**
 * Generate a cryptographically secure random token for email unsubscribe
 */
export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create and store an unsubscribe token for a user
 */
export async function createUnsubscribeToken(
  userId: string,
  notificationType?: notification_preference,
): Promise<string> {
  const token = generateUnsubscribeToken()

  const pg: SupabaseDirectClient = createSupabaseDirectClient()
  await pg.none(
    `INSERT INTO email_unsubscribe_tokens (token, user_id, notification_type)
     VALUES ($1, $2, $3)`,
    [token, userId, notificationType],
  )

  return token
}

/**
 * Get the unsubscribe URL for a token
 */
export function getUnsubscribeUrlOneClick(token: string): string {
  return `https://${PROD_CONFIG.backendDomain}/unsubscribe/${token}`
}
