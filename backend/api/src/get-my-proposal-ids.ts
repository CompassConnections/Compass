import {type APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The ids of the proposals the caller wrote, so the page can offer "Edit" on their own ones.
 *
 * Needed because `get_votes_with_results` nulls `creator_id` on anonymous proposals for everyone,
 * the author included — the client has no per-user token, so the function cannot tell them apart.
 * This goes through the API as the caller, and tells nobody else anything.
 */
export const getMyProposalIds: APIHandler<'get-my-proposal-ids'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.manyOrNone<{id: number}>(`select id from votes where creator_id = $1`, [
    auth.uid,
  ])

  return {ids: rows.map((r) => r.id)}
}
