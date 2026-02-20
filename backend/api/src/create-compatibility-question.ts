import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUser} from 'shared/utils'

import {APIError, APIHandler} from './helpers/endpoint'

export const createCompatibilityQuestion: APIHandler<'create-compatibility-question'> = async (
  {question, options},
  auth,
) => {
  const creator = await getUser(auth.uid)
  if (!creator) throw new APIError(401, 'Your account was not found')

  const pg = createSupabaseDirectClient()

  const {data, error} = await tryCatch(
    insert(pg, 'compatibility_prompts', {
      creator_id: creator.id,
      question,
      answer_type: 'compatibility_multiple_choice',
      multiple_choice_options: options,
    }),
  )

  if (error) throw new APIError(401, 'Error creating question')

  return {question: data}
}
