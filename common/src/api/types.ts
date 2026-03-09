import {Row} from 'common/supabase/utils'

export type QuestionWithStats = Row<'compatibility_prompts'> & {
  answer_count: number
  score: number
  community_importance_percent: number
}
