import { Row as rowFor, run } from 'common/supabase/utils'
import { db } from 'web/lib/supabase/db'

export const deleteAnswer = async (
  answer: rowFor<'compatibility_answers_free'>,
  userId?: string
) => {
  if (!userId || answer.creator_id !== userId) return
  await run(
    db
      .from('compatibility_answers_free')
      .delete()
      .match({ id: answer.id, creator_id: userId })
  )
}

export const getOtherAnswers = async (question_id: number) => {
  const { data } = await db.rpc('get_compatibility_answers_and_profiles' as any, {
    p_question_id: question_id,
  })
  return data
}
