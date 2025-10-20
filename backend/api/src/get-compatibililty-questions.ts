import { type APIHandler } from 'api/helpers/endpoint'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { Row } from 'common/supabase/utils'

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]; // copy to avoid mutating the original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const getCompatibilityQuestions: APIHandler<
  'get-compatibility-questions'
> = async (_props, _auth) => {
  const pg = createSupabaseDirectClient()

  const questions = await pg.manyOrNone<
    Row<'compatibility_prompts'> & { answer_count: number; score: number }
  >(
    `SELECT 
      compatibility_prompts.*,
      COUNT(compatibility_answers.question_id) as answer_count,
      AVG(POWER(compatibility_answers.importance + 1 + CASE WHEN compatibility_answers.explanation IS NULL THEN 1 ELSE 0 END, 2)) as score
    FROM 
        compatibility_prompts
    LEFT JOIN 
        compatibility_answers ON compatibility_prompts.id = compatibility_answers.question_id
    WHERE 
        compatibility_prompts.answer_type = 'compatibility_multiple_choice'
    GROUP BY 
        compatibility_prompts.id
    ORDER BY
         compatibility_prompts.importance_score
    `,
    []
  )

  // const questions = shuffle(dbQuestions)

  // console.debug(
  //   'got questions',
  //   questions.map((q) => q.question + ' ' + q.score)
  // )

  return {
    status: 'success',
    questions,
  }
}
