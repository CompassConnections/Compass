import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {APIError} from 'common/api/utils'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'

export const deleteCompatibilityAnswer: APIHandler<'delete-compatibility-answer'> = async (
  {id}, auth) => {
  const pg = createSupabaseDirectClient()

  // Verify user is the answer author
  const item = await pg.oneOrNone(
    `SELECT *
     FROM compatibility_answers
     WHERE id = $1
       AND creator_id = $2`,
    [id, auth.uid]
  )

  if (!item) {
    throw new APIError(404, 'Item not found')
  }

  // Delete the answer
  await pg.none(
    `DELETE
     FROM compatibility_answers
     WHERE id = $1
       AND creator_id = $2`,
    [id, auth.uid]
  )

  const continuation = async () => {
    // Recompute precomputed compatibility scores for this user
    await recomputeCompatibilityScoresForUser(auth.uid, pg)
  }

  return {
    status: 'success',
    continue: continuation,
  }
}
