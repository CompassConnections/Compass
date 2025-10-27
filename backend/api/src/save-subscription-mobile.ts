import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const saveSubscriptionMobile: APIHandler<'save-subscription-mobile'> = async (body, auth) => {
  const {token} = body

  if (!token) {
    throw new APIError(400, `Invalid subscription object`)
  }

  const userId = auth?.uid

  try {
    const pg = createSupabaseDirectClient()
    // Check if a subscription already exists
    const exists = await pg.oneOrNone(
      'select id from push_subscriptions_mobile where token = $1',
      [token]
    );

    if (!exists) {
      await pg.none(`insert into push_subscriptions_mobile(token, platform, user_id) values($1, $2, $3) `,
        [token, 'android', userId]
      );
    }

    return {success: true};
  } catch (err) {
    console.error('Error saving subscription', err);
    throw new APIError(500, `Failed to save subscription`)
  }
}
