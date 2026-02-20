import {Row, run} from 'common/supabase/utils'
import {db} from 'web/lib/supabase/db'
export type Question = Row<'compatibility_prompts'>
export type Answer = Row<'compatibility_answers_free'>
export const getAllQuestions = async () => {
  const res = await run(db.from('compatibility_prompts').select('*').order('created_time'))
  return res.data
}

export const getFreeResponseQuestions = async () => {
  const res = await run(
    db
      .from('compatibility_prompts')
      .select('*')
      .order('created_time')
      .eq('answer_type', 'free_response'),
  )
  return res.data
}

export const getUserAnswers = async (userId: string) => {
  const {data} = await run(
    db.from('compatibility_answers_free').select('*').eq('creator_id', userId),
  )
  return data
}

export const getUserCompatibilityAnswers = async (userId: string) => {
  const {data} = await run(
    db
      .from('compatibility_answers')
      .select('*')
      .eq('creator_id', userId)
      .order('importance', {ascending: false}),
  )
  return data
}

export const getFRQuestionsWithAnswerCount = async () => {
  const {data} = await db.rpc('get_fr_questions_with_answer_count' as any)
  return data
}

export const getCompatibilityQuestionsWithAnswerCount = async () => {
  const {data} = await db.rpc('get_compatibility_prompts_with_answer_count' as any)
  return data
}
