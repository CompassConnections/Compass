import {APIHandler} from 'api/helpers/endpoint'
import {APIErrors} from 'common/api/utils'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Removes a compatibility prompt outright, from `/admin/compatibility-questions`.
 *
 * Deliberately does **not** touch `compatibility_scores`. Every answer to this prompt cascades away, so
 * the cached score of every pair who had answered it is wrong the moment this returns — and that is the
 * intended trade. Retiring questions is done in batches, each deletion would otherwise rebuild the whole
 * cache, and a rebuild after the fifth deletion is the only one whose result survives. Run
 * `recompute-all-compatibility-scores` once when the batch is done.
 *
 * `expectedAnswerCount` is required rather than optional, for the same reason it is on `delete-option`:
 * the safeguard is that the caller looked at how many members this discards, and a count read from a page
 * loaded ten minutes ago is exactly the one that understates it.
 */
export const deleteCompatibilityPrompt: APIHandler<'delete-compatibility-prompt'> = async (
  {questionId, expectedAnswerCount},
  auth,
) => {
  await throwErrorIfNotAdmin(auth.uid)

  const pg = createSupabaseDirectClient()

  const current = await pg.oneOrNone<{question: string; answer_count: string}>(
    `select cp.question,
            (select count(*) from compatibility_answers a where a.question_id = cp.id and a.multiple_choice >= 0) as answer_count
     from compatibility_prompts cp
     where cp.id = $(questionId)`,
    {questionId},
  )
  if (!current) throw APIErrors.notFound('No such compatibility question')

  const answerCount = Number(current.answer_count ?? 0)
  if (answerCount !== expectedAnswerCount) {
    throw APIErrors.conflict(
      `"${current.question}" now has ${answerCount} answer(s), not ${expectedAnswerCount}. ` +
        `Reload and look again before deleting it.`,
    )
  }

  // Cascades to compatibility_answers, compatibility_answers_free, compatibility_prompts_translations
  // and compatibility_prompts_pinned — the reason this is a plain DELETE and not a hand-rolled cleanup.
  await pg.none(`delete from compatibility_prompts where id = $(questionId)`, {questionId})

  return {question: current.question, removedAnswers: answerCount}
}
