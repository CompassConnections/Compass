import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

/**
 * Called on sign-out, while the session is still valid, so the device stops receiving the
 * signed-out member's notifications and is free for the next account to claim.
 *
 * `save-subscription*` no longer hands a token that belongs to someone else over to whoever sends
 * it (that let anyone holding another member's token redirect their notifications), so this is how
 * a shared device changes hands. Only the caller's own rows are removed; a token owned by anyone
 * else is left alone, and the response does not say which happened.
 */
export const deleteSubscription: APIHandler<'delete-subscription'> = async (
  {endpoint, token},
  auth,
) => {
  if (!endpoint && !token) {
    throw APIErrors.badRequest('Missing endpoint or token')
  }

  const pg = createSupabaseDirectClient()
  if (endpoint) {
    await pg.none('delete from push_subscriptions where endpoint = $1 and user_id = $2', [
      endpoint,
      auth.uid,
    ])
  }
  if (token) {
    await pg.none('delete from push_subscriptions_mobile where token = $1 and user_id = $2', [
      token,
      auth.uid,
    ])
  }

  return {success: true}
}
