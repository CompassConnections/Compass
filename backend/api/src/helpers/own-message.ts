import {assertNotBlocked} from 'api/helpers/blocks'
import {APIErrors} from 'api/helpers/endpoint'
import {SupabaseDirectClient} from 'shared/supabase/init'

/**
 * The message `userId` wants to edit or delete, provided they still may.
 *
 * Authorship alone is not enough. Once a member has left the chat, or a block stands between them
 * and anyone else in it, the thread is frozen for them: they cannot post (see
 * `createPrivateUserMessageMain` and `create-private-user-message.ts`), and they cannot rewrite or
 * remove what they already said either. Otherwise a harasser who had just been blocked could go back
 * and edit or delete the very messages the other person is about to report.
 *
 * The other members are taken whether or not they have left, the same set `create-private-user-message`
 * checks: a block against someone who already walked away still counts.
 */
export const getChangeableOwnMessage = async (
  pg: SupabaseDirectClient,
  messageId: number,
  userId: string,
  {includeDeleted = true}: {includeDeleted?: boolean} = {},
) => {
  const message = await pg.oneOrNone<{
    channel_id: number
    member_status: string | null
    other_member_ids: string[]
  }>(
    `select msg.*,
            m.status as member_status,
            coalesce((select array_agg(o.user_id)
                      from private_user_message_channel_members o
                      where o.channel_id = msg.channel_id
                        and o.user_id != $2), '{}') as other_member_ids
     from private_user_messages msg
              left join private_user_message_channel_members m
                        on m.channel_id = msg.channel_id and m.user_id = $2
     where msg.id = $1
       and msg.user_id = $2
       and ($3 or msg.deleted = false)`,
    [messageId, userId, includeDeleted],
  )

  if (!message) throw APIErrors.notFound('Message not found')

  if (!message.member_status || message.member_status === 'left') {
    throw APIErrors.forbidden('You are no longer in this chat')
  }

  await assertNotBlocked(userId, message.other_member_ids)

  return message
}
