import {MAX_COMMENT_JSON_LENGTH} from 'api/create-comment'
import {assertNotBlocked} from 'api/helpers/blocks'
import {APIErrors, APIHandler, assertCanWrite} from 'api/helpers/endpoint'
import {assertAcceptableOpener, isOpener} from 'api/helpers/first-message'
import {createPrivateUserMessageMain} from 'api/helpers/private-messages'
import {isAdminId, isModUsername} from 'common/envs/constants'
import {isSuspiciousId} from 'common/moderation/suspicious'
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
  assertCanWrite(creator)
  if (isSuspiciousId(creator.id)) throw APIErrors.forbidden('Suspicious users cannot send messages')

  const pg = createSupabaseDirectClient()

  // The channel-creation guard in `create-private-user-message-channel.ts` only runs once, when the
  // channel is opened. Without this, blocking someone you had already spoken to did nothing at all:
  // the existing channel stayed writable in both directions, which is exactly the case blocking is
  // for. The thread itself stays readable — see `web/pages/messages/[channelId].tsx`.
  const otherMemberIds = (
    await pg.manyOrNone<{user_id: string}>(
      `select user_id from private_user_message_channel_members where channel_id = $1 and user_id != $2`,
      [channelId, creator.id],
    )
  ).map((r) => r.user_id)
  await assertNotBlocked(creator.id, otherMemberIds)

  // The first message of a 1:1 conversation has to meet the first-message rules (length, says
  // something about the recipient, not a copy of an earlier opener) — see
  // `api/helpers/first-message.ts`. Staff are exempt for the same reason as in the channel guard:
  // support and moderation legitimately open many near-identical conversations. Group channels are
  // left alone; there is no one profile for an opener to anchor to.
  const isStaff = isAdminId(creator.id) || isModUsername(creator.username)
  if (!isStaff && otherMemberIds.length === 1 && (await isOpener(pg, channelId))) {
    await assertAcceptableOpener(pg, creator, otherMemberIds[0], content)
  }

  return await createPrivateUserMessageMain(creator, channelId, content, pg, 'private')
}
