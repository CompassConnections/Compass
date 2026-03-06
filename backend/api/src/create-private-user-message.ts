import {MAX_COMMENT_JSON_LENGTH} from 'api/create-comment'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {createPrivateUserMessageMain} from 'api/helpers/private-messages'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

export const createPrivateUserMessage: APIHandler<'create-private-user-message'> = async (
  body,
  auth,
) => {
  const {content, channelId} = body
  if (JSON.stringify(content).length > MAX_COMMENT_JSON_LENGTH) {
    throw APIErrors.badRequest(`Message JSON should be less than ${MAX_COMMENT_JSON_LENGTH}`)
  }

  const creator = await getUser(auth.uid)
  if (!creator) throw APIErrors.unauthorized('Your account was not found')
  if (creator.isBannedFromPosting) throw APIErrors.forbidden('You are banned')

  const pg = createSupabaseDirectClient()
  return await createPrivateUserMessageMain(creator, channelId, content, pg, 'private')
}
