import {type APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The caller's own ballot on every proposal, keyed by proposal id, so each card can highlight the
 * button they picked.
 *
 * Takes no member id on purpose: ballots are private. The web used to read `vote_results` straight
 * from PostgREST, where anyone with the public key could see how every member voted.
 */
export const getMyVoteChoices: APIHandler<'get-my-vote-choices'> = async (_props, auth) => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.manyOrNone<{vote_id: number; choice: number}>(
    `select vote_id, choice from vote_results where user_id = $1`,
    [auth.uid],
  )

  return {choices: Object.fromEntries(rows.map((r) => [r.vote_id, r.choice]))}
}
