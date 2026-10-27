import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUser} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const createCompatibilityQuestion: APIHandler<'create-compatibility-question'> = async (
  {question, options},
  auth,
) => {
  const creator = await getUser(auth.uid)
  if (!creator) throw APIErrors.unauthorized('Your account was not found')

  const pg = createSupabaseDirectClient()

  const {data, error} = await tryCatch(
    insert(pg, 'compatibility_prompts', {
      creator_id: creator.id,
      question,
      answer_type: 'compatibility_multiple_choice',
      multiple_choice_options: options,
      // Member-created prompts are never core: 0 keeps them out of the guided first run and sorted
      // after the ramp (see docs/compatibility-questions.md). Set explicitly rather than trusting the
      // column default, which has not always been 0.
      importance_score: 0,
    }),
  )

  if (error) throw APIErrors.internalServerError('Error creating question')

  return {question: data}
}
