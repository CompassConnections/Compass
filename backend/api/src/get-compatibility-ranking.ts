import {APIHandler} from 'api/helpers/endpoint'
import {CompatibilityRankingEntry} from 'common/api/types'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * A member's most compatible people, for `/admin/compatibility`.
 *
 * Reads the cache exactly as the Compatible sort in `get-profiles` does — by the low edge of the
 * range, the point estimate breaking ties — so what the admin sees is the order members get. Every
 * stored pair is eligible, including members who are not `looking_for_matches`: the page is for
 * checking the algorithm, not for browsing.
 */
export const getCompatibilityRanking: APIHandler<'get-compatibility-ranking'> = async (
  {userId, limit},
  auth,
) => {
  await throwErrorIfNotAdmin(auth.uid)
  const pg = createSupabaseDirectClient()
  return await pg.map(
    `select case when cs.user_id_1 = $1 then cs.user_id_2 else cs.user_id_1 end as user_id,
            u.name,
            u.username,
            p.pinned_url,
            cs.score,
            cs.score_low,
            cs.score_high,
            cs.shared_answers,
            cs.prompt_score,
            cs.prompt_score_low,
            cs.prompt_score_high
     from compatibility_scores cs
              join profiles p
                   on p.user_id = case when cs.user_id_1 = $1 then cs.user_id_2 else cs.user_id_1 end
              join users u on u.id = p.user_id
     where (cs.user_id_1 = $1 or cs.user_id_2 = $1)
       and cs.score is not null
     order by coalesce(cs.score_low, cs.score) desc, cs.score desc
     limit $2`,
    [userId, limit],
    (r): CompatibilityRankingEntry => {
      const n = r.shared_answers ?? 0
      return {
        userId: r.user_id,
        name: r.name,
        username: r.username,
        avatarUrl: r.pinned_url ?? null,
        score: r.score,
        low: r.score_low ?? undefined,
        high: r.score_high ?? undefined,
        sharedAnswers: r.shared_answers ?? undefined,
        confidence: n < 10 ? 'low' : n < 100 ? 'medium' : 'high',
        prompt:
          r.prompt_score == null
            ? undefined
            : {
                score: r.prompt_score,
                low: r.prompt_score_low ?? undefined,
                high: r.prompt_score_high ?? undefined,
              },
      }
    },
  )
}
