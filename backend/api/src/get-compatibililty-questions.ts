import {type APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {Row} from 'common/supabase/utils'

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
> = async (props, _auth) => {
  const {locale = 'en'} = props
  const pg = createSupabaseDirectClient()

  const questions = await pg.manyOrNone<
    Row<'compatibility_prompts'> & { answer_count: number; score: number }
  >(
    `
        SELECT cp.id,
               cp.answer_type,
               cp.importance_score,
               cp.created_time,
               cp.creator_id,
               cp.category,

               -- locale-aware fields
               COALESCE(cpt.question, cp.question)                               AS question,
               COALESCE(cpt.multiple_choice_options, cp.multiple_choice_options) AS multiple_choice_options,

               COUNT(ca.question_id)                                             AS answer_count,
               AVG(
                       POWER(
                               ca.importance + 1 +
                               CASE WHEN ca.explanation IS NULL THEN 1 ELSE 0 END,
                               2
                       )
               )                                                                 AS score

        FROM compatibility_prompts cp

                 LEFT JOIN compatibility_answers ca
                           ON cp.id = ca.question_id

                 LEFT JOIN compatibility_prompts_translations cpt
                           ON cp.id = cpt.question_id
                               AND cpt.locale = $1
                               AND $1 <> 'en'

        WHERE cp.answer_type = 'compatibility_multiple_choice'

        GROUP BY cp.id,
                 cpt.question,
                 cpt.multiple_choice_options

        ORDER BY cp.importance_score
    `,
    [locale]
  )

  // console.debug({questions})

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
