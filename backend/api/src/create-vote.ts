import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUser} from 'shared/utils'

import {APIError, APIHandler} from './helpers/endpoint'

export const createVote: APIHandler<'create-vote'> = async (
  {title, description, isAnonymous},
  auth,
) => {
  const creator = await getUser(auth.uid)
  if (!creator) throw new APIError(401, 'Your account was not found')

  const pg = createSupabaseDirectClient()

  const {data, error} = await tryCatch(
    insert(pg, 'votes', {
      creator_id: creator.id,
      title,
      description,
      is_anonymous: isAnonymous,
      status: 'voting_open',
    }),
  )

  if (error) throw new APIError(401, 'Error creating question')

  return {data}
}
