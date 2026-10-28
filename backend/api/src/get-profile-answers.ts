import {type APIHandler} from 'api/helpers/endpoint'
import {canReadProfileContent} from 'api/helpers/profile-visibility'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * One member's compatibility answers, as the caller may see them.
 *
 * The web reads its own answers and the answers of whichever profile it is comparing against through
 * this (`useUserCompatibilityAnswers`); it used to read `compatibility_answers` straight from
 * PostgREST, which could not tell who was asking. An empty list for a profile the caller may not see
 * — members-only, disabled, banned, or blocked either way — rather than an error, so the shape is the
 * same as for a member who simply has not answered anything.
 */
export const getProfileAnswers: APIHandler<'get-profile-answers'> = async (props, auth) => {
  const {userId} = props

  if (!(await canReadProfileContent(auth.uid, userId))) {
    return {status: 'success', answers: []}
  }

  const pg = createSupabaseDirectClient()

  const answers = await pg.manyOrNone<Row<'compatibility_answers'>>(
    `select * from compatibility_answers
    where
      creator_id = $1
    order by created_time desc
    `,
    [userId],
  )

  return {
    status: 'success',
    answers,
  }
}
