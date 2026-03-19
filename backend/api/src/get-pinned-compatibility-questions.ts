import type {APIHandler} from 'api/helpers/endpoint'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export async function getPinnedQuestionIds(userId: string) {
  const pg = createSupabaseDirectClient()
  const rows = await pg.manyOrNone<Row<'compatibility_prompts_pinned'>>(
    `select * from compatibility_prompts_pinned
     where user_id = $1
     order by created_time desc`,
    [userId],
  )
  // newest-first in table; return in that order
  return rows.map((r) => r.question_id)
}

export const getPinnedCompatibilityQuestions: APIHandler<
  'get-pinned-compatibility-questions'
> = async (_props, auth) => {
  const pinnedQuestionIds = await getPinnedQuestionIds(auth.uid)
  return {status: 'success', pinnedQuestionIds}
}
