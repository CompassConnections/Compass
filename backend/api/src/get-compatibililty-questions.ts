import {type APIHandler} from 'api/helpers/endpoint'
import {QuestionWithStats} from 'common/api/types'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getCompatibilityQuestions: APIHandler<'get-compatibility-questions'> = async (
  props,
  _auth,
) => {
  const {locale = 'en', keyword} = props
  const pg = createSupabaseDirectClient()

  // Build query parameters
  const params: (string | number)[] = [locale]
  const paramIndex = 2

  // Build keyword filter condition - search in question text and multiple_choice_options keys
  const keywordFilter = keyword
    ? `AND (
        COALESCE(cpt.question, cp.question) ILIKE $${paramIndex}
        OR EXISTS (
          SELECT 1 
          FROM jsonb_object_keys(
            COALESCE(cpt.multiple_choice_options, cp.multiple_choice_options)
          ) AS option_key
          WHERE option_key ILIKE $${paramIndex}
        )
      )`
    : ''

  if (keyword) {
    params.push(`%${keyword}%`)
  }

  const questions = await pg.manyOrNone<QuestionWithStats>(
    `
        SELECT cp.id,
               cp.answer_type,
               cp.importance_score,
               cp.created_time,
               cp.creator_id,
               cp.category,
               COALESCE(cpt.question, cp.question) AS question,
               COALESCE(cpt.multiple_choice_options, cp.multiple_choice_options) AS multiple_choice_options,
               cp.answer_count,
               CASE
                 WHEN cp.answer_count IS NULL OR cp.answer_count = 0 THEN 0
                 --- community_importance_score is a weighted sum: max val is 2 * answer_count if everyone marks at the highest level of importance
                 --- So we divide by 2 * answer_count to ensure it's between and 0 and 1
                 --- We damp by 20 to ensure questions with few responders don't get a high score
                 --- The square root is to spread the percent of all questions, since in the early days they don't get higher than 50%.
                 --- It does not impact ranking though.
                 --- TODO: remove the square root when we get more answers
                 ELSE SQRT(cp.community_importance_score::float / (cp.answer_count + 20) / 2) * 100
                 END AS community_importance_percent,
               0 AS score --- update later if needed

        FROM compatibility_prompts cp

                 LEFT JOIN compatibility_prompts_translations cpt
                           ON cp.id = cpt.question_id
                               AND cpt.locale = $1
                               AND $1 <> 'en'

        WHERE cp.answer_type = 'compatibility_multiple_choice'
            ${keywordFilter}

        GROUP BY cp.id,
                 cpt.question,
                 cpt.multiple_choice_options

        ORDER BY cp.importance_score
    `,
    params,
  )

  // console.debug(questions.find((q) => q.id === 275))

  return {
    status: 'success',
    questions,
  }
}
