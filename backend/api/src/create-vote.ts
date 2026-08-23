import {sendDiscordMessage} from 'common/discord/core'
import {newProposalDiscordMessage} from 'common/discord/messages'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUser} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const createVote: APIHandler<'create-vote'> = async (
  {title, description, isAnonymous},
  auth,
) => {
  const creator = await getUser(auth.uid)
  if (!creator) throw APIErrors.unauthorized('Your account was not found')

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

  if (error) throw APIErrors.unauthorized('Error creating question')

  const continuation = async () => {
    try {
      // Null for an anonymous proposal: the checkbox hides the author on the card and in the
      // discussion, and #suggestions is the one room where they would never see the promise broken.
      await sendDiscordMessage(
        newProposalDiscordMessage(
          {id: data.id, title, description},
          isAnonymous ? null : {name: creator.name, username: creator.username},
        ),
        'suggestions',
      )
    } catch (e) {
      console.error('Failed to send discord new proposal', e)
    }
  }

  return {result: {data}, continue: continuation}
}
