import {MAX_COMMENT_JSON_LENGTH} from 'api/helpers/comment'
import {APIErrors, APIHandler, assertCanWrite} from 'api/helpers/endpoint'
import {type Row} from 'common/supabase/utils'
import {isCommentable} from 'common/votes/constants'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

/**
 * Edit a proposal's title and description, keeping the earlier versions in `vote_edits`.
 *
 * Same shape as `edit-vote-comment`, and for the same reason: a proposal is what people voted on, so
 * an edit without a public record would let the author change the question after the answers were
 * in. With the record, editing can be allowed freely instead of being locked behind a time window.
 */
export const editVote: APIHandler<'edit-vote'> = async ({voteId, title, description}, auth) => {
  const user = await getUser(auth.uid)
  if (!user) throw APIErrors.unauthorized('Your account was not found')
  assertCanWrite(user)

  const trimmedTitle = title.trim()
  if (!trimmedTitle) throw APIErrors.badRequest('A proposal needs a title')
  if (JSON.stringify(description).length > MAX_COMMENT_JSON_LENGTH) {
    throw APIErrors.badRequest(
      `Description is too long; should be less than ${MAX_COMMENT_JSON_LENGTH} as a JSON string.`,
    )
  }

  const pg = createSupabaseDirectClient()

  const vote = await pg.oneOrNone<Row<'votes'>>(`select * from votes where id = $1`, [voteId])
  if (!vote) throw APIErrors.notFound('Proposal not found')

  // Authors only — not admins. Admins already own the status; rewriting what a member proposed is a
  // different power, and one nobody should have over someone else's words.
  if (vote.creator_id !== auth.uid) {
    throw APIErrors.forbidden('You can only edit your own proposal')
  }
  // Settled proposals freeze along with their discussion: the decision was made on the text as it
  // stood, and changing it afterwards would make the recorded outcome refer to something else.
  if (!isCommentable(vote.status)) {
    throw APIErrors.forbidden('This proposal is settled and can no longer be edited')
  }

  // Archive then update, in one transaction: a half-applied edit would either lose a version from
  // the record or claim an edit that never landed, and the record is the whole reason editing is
  // allowed this freely.
  await pg.tx(async (tx) => {
    await tx.none(`insert into vote_edits (vote_id, title, description) values ($1, $2, $3)`, [
      voteId,
      vote.title,
      vote.description,
    ])
    await tx.none(
      `update votes set title = $2, description = $3, edited_time = now() where id = $1`,
      [voteId, trimmedTitle, description],
    )
  })

  // Deliberately no notification and no Discord message: the original post already announced the
  // proposal, and re-announcing on every edit would make a typo fix a second interruption. The
  // "(edited)" marker on the proposal is what tells readers to check the record.
  return {status: 'success'}
}
