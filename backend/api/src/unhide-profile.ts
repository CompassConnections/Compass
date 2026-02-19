import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

// Unhide a profile for the requesting user by deleting from hidden_profiles.
// Idempotent: if the pair does not exist, succeed silently.
export const unhideProfile: APIHandler<'unhide-profile'> = async ({hiddenUserId}, auth) => {
  const pg = createSupabaseDirectClient()

  await pg.none(
    `delete
     from hidden_profiles
     where hider_user_id = $1
       and hidden_user_id = $2`,
    [auth.uid, hiddenUserId],
  )

  return {status: 'success'}
}
