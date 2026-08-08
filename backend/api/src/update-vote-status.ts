import {isAdminId} from 'common/envs/constants'
import {type Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const updateVoteStatus: APIHandler<'update-vote-status'> = async (
  {voteId, status},
  auth,
) => {
  // Admins only. The status is what decides whether a proposal accepts votes and comments at all, so
  // it is the one field on a proposal its own author must not be able to set — "voting_closed" the
  // moment the tally turns against them would be the obvious abuse.
  if (!isAdminId(auth.uid)) {
    throw APIErrors.forbidden('Only admins can change a proposal status')
  }

  const pg = createSupabaseDirectClient()

  const vote = await pg.oneOrNone<Row<'votes'>>(
    `update votes set status = $2 where id = $1 returning *`,
    [voteId, status],
  )
  if (!vote) throw APIErrors.notFound('Proposal not found')

  return {status: vote.status ?? status}
}
