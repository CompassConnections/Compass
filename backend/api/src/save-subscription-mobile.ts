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
    await pg.none(`
                insert into push_subscriptions_mobile(token, platform, user_id)
                values ($1, $2, $3)
                on conflict(token) do update set platform = excluded.platform,
                                                 user_id = excluded.user_id
      `,
      [token, 'android', userId]
    );
    return {success: true};
  } catch (err) {
    console.error('Error saving subscription', err);
    throw new APIError(500, `Failed to save subscription`)
  }
}
