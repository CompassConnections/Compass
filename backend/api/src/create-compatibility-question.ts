import { createSupabaseDirectClient } from 'shared/supabase/init'
import { getUser } from 'shared/utils'
import { APIHandler, APIError } from './helpers/endpoint'
import { insert } from 'shared/supabase/utils'
import { tryCatch } from 'common/util/try-catch'

export const createCompatibilityQuestion: APIHandler<
  'create-compatibility-question'
> = async ({ question, options }, auth) => {
  const creator = await getUser(auth.uid)
  if (!creator) throw new APIError(401, 'Your account was not found')

  const pg = createSupabaseDirectClient()

  const { data, error } = await tryCatch(
    insert(pg, 'compatibility_prompts', {
      creator_id: creator.id,
      question,
      answer_type: 'compatibility_multiple_choice',
      multiple_choice_options: options,
    })
  )

  if (error) throw new APIError(401, 'Error creating question')

  return { question: data }
}
