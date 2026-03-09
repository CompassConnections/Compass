import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {
  recomputeCompatibilityScoresForUser,
  updateCompatibilityPromptsMetrics,
} from 'shared/compatibility/compute-scores'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const deleteCompatibilityAnswer: APIHandler<'delete-compatibility-answer'> = async (
  {id},
  auth,
) => {
  const pg = createSupabaseDirectClient()

  // Verify user is the answer author
  const item = await pg.oneOrNone(
    `SELECT *
     FROM compatibility_answers
     WHERE id = $1
       AND creator_id = $2`,
    [id, auth.uid],
  )

  if (!item) {
    throw APIErrors.notFound('Item not found')
  }

  const questionId = item.question_id

  // Delete the answer
  await pg.none(
    `DELETE
     FROM compatibility_answers
     WHERE id = $1
       AND creator_id = $2`,
    [id, auth.uid],
  )

  const continuation = async () => {
    await updateCompatibilityPromptsMetrics(questionId)
    await recomputeCompatibilityScoresForUser(auth.uid)
  }

  return {
    result: {status: 'success'},
    continue: continuation,
  }
}
