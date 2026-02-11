import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

// Hide a profile for the requesting user by inserting a row into hidden_profiles.
// Idempotent: if the pair already exists, succeed silently.
export const hideProfile: APIHandler<'hide-profile'> = async (
  {hiddenUserId},
  auth
) => {
  if (auth.uid === hiddenUserId)
    throw new APIError(400, 'You cannot hide yourself')

  const pg = createSupabaseDirectClient()

  // Insert idempotently: do nothing on conflict
  await pg.none(
    `insert into hidden_profiles (hider_user_id, hidden_user_id)
     values ($1, $2)
     on conflict (hider_user_id, hidden_user_id) do nothing`,
    [auth.uid, hiddenUserId]
  )

  return {status: 'success'}
}
