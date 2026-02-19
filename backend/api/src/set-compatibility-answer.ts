import {Row} from 'common/supabase/utils'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const setCompatibilityAnswer: APIHandler<'set-compatibility-answer'> = async (
  {questionId, multipleChoice, prefChoices, importance, explanation},
  auth,
) => {
  const pg = createSupabaseDirectClient()

  const result = await pg.one<Row<'compatibility_answers'>>({
    text: `
        INSERT INTO compatibility_answers
        (creator_id, question_id, multiple_choice, pref_choices, importance, explanation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (question_id, creator_id)
            DO UPDATE SET multiple_choice = EXCLUDED.multiple_choice,
                          pref_choices    = EXCLUDED.pref_choices,
                          importance      = EXCLUDED.importance,
                          explanation     = EXCLUDED.explanation
        RETURNING *
    `,
    values: [auth.uid, questionId, multipleChoice, prefChoices, importance, explanation ?? null],
  })

  const continuation = async () => {
    // Recompute precomputed compatibility scores for this user
    await recomputeCompatibilityScoresForUser(auth.uid, pg)
  }

  return {
    result: result,
    continue: continuation,
  }
}
