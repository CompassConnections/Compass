import { APIError, APIHandler } from 'api/helpers/endpoint'
import { getUser } from 'shared/utils'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { MAX_COMMENT_JSON_LENGTH } from 'api/create-comment'
import { createPrivateUserMessageMain } from 'api/junk-drawer/private-messages'

export const createPrivateUserMessage: APIHandler<
  'create-private-user-message'
> = async (body, auth) => {
  const { content, channelId } = body
  if (JSON.stringify(content).length > MAX_COMMENT_JSON_LENGTH) {
    throw new APIError(
      400,
      `Message JSON should be less than ${MAX_COMMENT_JSON_LENGTH}`
    )
  }
  const pg = createSupabaseDirectClient()
  const creator = await getUser(auth.uid)
  if (!creator) throw new APIError(401, 'Your account was not found')
  if (creator.isBannedFromPosting) throw new APIError(403, 'You are banned')
  return await createPrivateUserMessageMain(
    creator,
    channelId,
    content,
    pg,
    'private'
  )
}
