import {getPinnedQuestionIds} from 'api/get-pinned-compatibility-questions'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {type APIHandler} from './helpers/endpoint'

export const updateCompatibilityQuestionPin: APIHandler<
  'update-compatibility-question-pin'
> = async ({questionId, pinned}, auth) => {
  const pg = createSupabaseDirectClient()

  if (pinned) {
    await pg.none(
      `insert into compatibility_prompts_pinned (user_id, question_id)
         values ($1, $2)
         on conflict (user_id, question_id) do nothing`,
      [auth.uid, questionId],
    )
  } else {
    await pg.none(
      `delete from compatibility_prompts_pinned
         where user_id = $1 and question_id = $2`,
      [auth.uid, questionId],
    )
  }

  const pinnedQuestionIds = await getPinnedQuestionIds(auth.uid)
  return {status: 'success', pinnedQuestionIds}
}
