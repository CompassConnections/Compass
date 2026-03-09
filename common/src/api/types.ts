import {Row} from 'common/supabase/utils'

export type QuestionWithStats = Omit<Row<'compatibility_prompts'>, 'community_importance_score'> & {
  answer_count: number
  score: number
  community_importance_percent: number
}
