import {validateCommentAuthor} from 'api/helpers/comment'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {MAX_VOTE_COMMENT_LENGTH} from 'common/comment'
import {Notification} from 'common/notifications'
import {convertVoteComment} from 'common/supabase/comment'
import {type Row} from 'common/supabase/utils'
import {User} from 'common/user'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {richTextToString} from 'common/util/parse'
import {isCommentable, Stance} from 'common/votes/constants'
import * as crypto from 'crypto'
import {sendProposalCommentEmail} from 'email/functions/helpers'
import {uniq} from 'lodash'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser, getUser} from 'shared/utils'
import {broadcastUpdatedVoteComment} from 'shared/websockets/helpers'

// At most one "someone argued about this proposal" notification per proposal per person per day.
// Every past voter is a recipient, so a contentious proposal would otherwise be a notification
// firehose — and the second ping adds nothing the first didn't ("go re-read the thread").
const NOTIFICATION_THROTTLE_HOURS = 24

export const createVoteComment: APIHandler<'create-vote-comment'> = async (
  {voteId, content: submittedContent, replyToCommentId, stance},
  auth,
) => {
  const {creator, content} = await validateCommentAuthor(auth.uid, submittedContent)

  // Measured on the rendered text, not the JSON: the editor counts characters the same way, so a
  // comment the client accepted can't be rejected here for markup the author never sees.
  const text = richTextToString(content)
  // 100 margin for the @username prefix for replies. Could find a way to measure this more cleanly.
  if (text.length > MAX_VOTE_COMMENT_LENGTH + 100) {
    throw APIErrors.badRequest(
      `Comment is too long; keep it under ${MAX_VOTE_COMMENT_LENGTH} characters.`,
    )
  }

  const pg = createSupabaseDirectClient()

  const vote = await pg.oneOrNone<Row<'votes'>>(`select * from votes where id = $1`, [voteId])
  if (!vote) throw APIErrors.notFound('Proposal not found')
  if (!isCommentable(vote.status)) {
    throw APIErrors.forbidden('This proposal is settled — its discussion is closed')
  }

  // One level of threading only: a reply to a reply gets attached to the same parent, so the thread
  // stays readable and "top argument against" keeps meaning something.
  let parentId: number | null = null
  if (replyToCommentId) {
    const parent = await pg.oneOrNone<Row<'vote_comments'>>(
      `select * from vote_comments where id = $1 and vote_id = $2`,
      [Number(replyToCommentId), voteId],
    )
    if (!parent) throw APIErrors.notFound('Comment replied to was not found')
    parentId = parent.reply_to_comment_id ?? parent.id
  }

  const comment = await pg.one<Row<'vote_comments'>>(
    `insert into vote_comments (vote_id, user_id, user_name, user_username, user_avatar_url, content, reply_to_comment_id, stance)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [
      voteId,
      creator.id,
      creator.name,
      creator.username,
      creator.avatarUrl,
      content,
      parentId,
      stance ?? null,
    ],
  )

  broadcastUpdatedVoteComment(convertVoteComment(comment))

  await notifyProposalParticipants(pg, {
    voteId,
    voteTitle: vote.title,
    commentId: comment.id,
    creator,
    stance,
    sourceText: text,
  })

  return {status: 'success'}
}

const notifyProposalParticipants = async (
  pg: SupabaseDirectClient,
  params: {
    voteId: number
    voteTitle: string
    commentId: number
    creator: User
    stance?: Stance
    sourceText: string
  },
) => {
  const {voteId, voteTitle, commentId, creator, stance, sourceText} = params

  // The point of the feature: someone who already voted needs to hear the counter-argument, or the
  // discussion only reaches the people who hadn't made up their mind yet. The proposal's author and
  // previous commenters are included too, so a thread can actually be a conversation.
  const rows = await pg.manyOrNone<{user_id: string}>(
    `select user_id from vote_results where vote_id = $1
     union
     select user_id from vote_comments where vote_id = $1 and not hidden
     union
     select creator_id as user_id from votes where id = $1`,
    [voteId],
  )

  const candidateIds = uniq(rows.map((r) => r.user_id)).filter((id) => id !== creator.id)
  if (!candidateIds.length) return

  // Muted threads and anyone already pinged inside the throttle window drop out in one query.
  const eligible = await pg.manyOrNone<{user_id: string}>(
    `select u.user_id
       from unnest($1::text[]) as u(user_id)
       left join vote_subscriptions s on s.user_id = u.user_id and s.vote_id = $2
      where coalesce(s.muted, false) = false
        and (s.last_notified_time is null
             or s.last_notified_time < now() - ($3 || ' hours')::interval)`,
    [candidateIds, voteId, NOTIFICATION_THROTTLE_HOURS],
  )

  for (const {user_id: userId} of eligible) {
    const privateUser = await getPrivateUser(userId)
    if (!privateUser) continue

    const {sendToBrowser, sendToEmail} = getNotificationDestinationsForUser(
      privateUser,
      'comment_on_proposal',
    )
    if (!sendToBrowser && !sendToEmail) continue

    if (sendToBrowser) {
      const notification: Notification = {
        id: crypto.randomUUID(),
        userId,
        reason: 'comment_on_proposal',
        createdTime: Date.now(),
        isSeen: false,
        sourceId: commentId.toString(),
        sourceType: 'comment_on_proposal',
        sourceUpdateType: 'created',
        sourceUserName: creator.name,
        sourceUserUsername: creator.username,
        sourceUserAvatarUrl: creator.avatarUrl,
        sourceText,
        sourceTitle: voteTitle,
        sourceSlug: `/vote/${voteId}#comment-${commentId}`,
        data: {voteId, stance},
      }
      await insertNotificationToSupabase(notification, pg)
    }

    if (sendToEmail) {
      const toUser = await getUser(userId)
      if (toUser) {
        await sendProposalCommentEmail(privateUser, creator, toUser, {
          proposalId: voteId,
          proposalTitle: voteTitle,
          commentText: sourceText,
          stance,
        })
      }
    }

    await pg.none(
      `insert into vote_subscriptions (user_id, vote_id, last_notified_time)
         values ($1, $2, now())
       on conflict (user_id, vote_id) do update set last_notified_time = now()`,
      [userId, voteId],
    )
  }
}
