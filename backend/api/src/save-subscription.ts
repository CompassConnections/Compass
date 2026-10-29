import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const saveSubscription: APIHandler<'save-subscription'> = async (body, auth) => {
  const {subscription} = body

  if (!subscription?.endpoint || !subscription?.keys) {
    throw APIErrors.badRequest('Invalid subscription object')
  }

  const userId = auth?.uid

  try {
    const pg = createSupabaseDirectClient()
    // An endpoint that already belongs to another member is left alone, keys included. It used to be
    // reassigned to whoever sent it, so anyone holding someone else's endpoint could redirect their
    // notifications — or overwrite the keys so the browser could no longer decrypt them. A row with no
    // owner yet can still be claimed. The response is the same either way, so it does not say whose
    // endpoint it was.
    await pg.none(
      `insert into push_subscriptions(endpoint, keys, user_id) values($1, $2, $3)
       on conflict(endpoint) do update set keys = excluded.keys, user_id = excluded.user_id
       where push_subscriptions.user_id is null or push_subscriptions.user_id = excluded.user_id
      `,
      [subscription.endpoint, subscription.keys, userId],
    )

    return {success: true}
  } catch (err) {
    console.error('Error saving subscription', err)
    throw APIErrors.internalServerError('Failed to save subscription')
  }
}
