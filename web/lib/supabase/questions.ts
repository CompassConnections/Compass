import {Row, run} from 'common/supabase/utils'
import {db} from 'web/lib/supabase/db'
export type Question = Row<'compatibility_prompts'>

export type QuestionWithAnswer = Question & {
  answer?: Row<'compatibility_answers'>
  answer_count: number
  score: number
  community_importance_percent: number
}

export const getAllQuestions = async () => {
  const res = await run(db.from('compatibility_prompts').select('*').order('created_time'))
  return res.data
}

