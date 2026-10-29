import {type APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The ids of the profiles the caller has starred, newest first.
 *
 * Takes no member id on purpose: who someone has saved is private to them. The web used to read this
 * through `get_profile_stars(creator)`, which anyone could call with any member's id on the anon key.
 */
export const getMyStars: APIHandler<'get-my-stars'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()

  const targetIds = await pg.map<string>(
    `select target_id from profile_stars
     where creator_id = $1
     order by created_time desc`,
    [auth.uid],
    (r) => r.target_id,
  )

  return {targetIds}
}
