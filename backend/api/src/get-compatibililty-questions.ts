import {type APIHandler} from 'api/helpers/endpoint'
import {Row} from 'common/supabase/utils'
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

  const questions = await pg.manyOrNone<Row<'compatibility_prompts'> & {score: number}>(
    `
        SELECT cp.id,
               cp.answer_type,
               cp.importance_score,
               cp.created_time,
               cp.creator_id,
               cp.category,
               cp.community_importance_score * (cp.answer_count::float / (cp.answer_count + 20)) AS community_importance_score,
               cp.answer_count,

               -- locale-aware fields
               COALESCE(cpt.question, cp.question)                               AS question,
               COALESCE(cpt.multiple_choice_options, cp.multiple_choice_options) AS multiple_choice_options,
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
            ${keywordFilter}

        GROUP BY cp.id,
                 cpt.question,
                 cpt.multiple_choice_options

        ORDER BY cp.importance_score
    `,
    params,
  )

  // debug({questions})

  return {
    status: 'success',
    questions,
  }
}
