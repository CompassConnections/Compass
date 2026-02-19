import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIError, APIHandler} from './helpers/endpoint'

export const saveSubscription: APIHandler<'save-subscription'> = async (body, auth) => {
  const {subscription} = body

  if (!subscription?.endpoint || !subscription?.keys) {
    throw new APIError(400, `Invalid subscription object`)
  }

  const userId = auth?.uid

  try {
    const pg = createSupabaseDirectClient()
    // Check if a subscription already exists
    const exists = await pg.oneOrNone('select id from push_subscriptions where endpoint = $1', [
      subscription.endpoint,
    ])

    if (exists) {
      // Already exists, optionally update keys and userId
      await pg.none('update push_subscriptions set keys = $1, user_id = $2 where id = $3', [
        subscription.keys,
        userId,
        exists.id,
      ])
    } else {
      await pg.none(
        `insert into push_subscriptions(endpoint, keys, user_id) values($1, $2, $3)
         on conflict(endpoint) do update set keys = excluded.keys
        `,
        [subscription.endpoint, subscription.keys, userId],
      )
    }

    return {success: true}
  } catch (err) {
    console.error('Error saving subscription', err)
    throw new APIError(500, `Failed to save subscription`)
  }
}
