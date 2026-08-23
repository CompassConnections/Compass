import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const saveSubscriptionMobile: APIHandler<'save-subscription-mobile'> = async (
  body,
  auth,
) => {
  const {token} = body
  // Defaulted rather than required: Android builds shipped before iOS existed send only a token, and
  // 'android' is the truthful answer for every one of them. Everything newer sends its own platform.
  const platform = body.platform ?? 'android'

  if (!token) {
    throw APIErrors.badRequest('Invalid subscription object')
  }

  const userId = auth?.uid

  try {
    const pg = createSupabaseDirectClient()
    await pg.none(
      `
                insert into push_subscriptions_mobile(token, platform, user_id)
                values ($1, $2, $3)
                on conflict(token) do update set platform = excluded.platform,
                                                 user_id = excluded.user_id
      `,
      [token, platform, userId],
    )
    return {success: true}
  } catch (err) {
    console.error('Error saving subscription', err)
    throw APIErrors.internalServerError('Failed to save subscription')
  }
}
