import {type APIHandler} from 'api/helpers/endpoint'
import {canReadProfileContent} from 'api/helpers/profile-visibility'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Someone's compatibility scores against everyone else. Any member may ask about any member, but
 * only within the same rule as the rest of a profile's content: a members-only, disabled, banned or
 * blocked profile answers with no scores at all, the same as a member nobody has been scored against.
 */
export const getCompatibleProfilesHandler: APIHandler<'compatible-profiles'> = async (
  props,
  auth,
) => {
  if (!(await canReadProfileContent(auth.uid, props.userId))) {
    return {status: 'success', profileCompatibilityScores: {}}
  }
  return getCompatibleProfiles(props.userId)
}

export const getCompatibleProfiles = async (userId: string) => {
  const pg = createSupabaseDirectClient()
  const scores = await pg.map(
    `select *
     from compatibility_scores
     where score is not null
       and (user_id_1 = $1 or user_id_2 = $1)`,
    [userId],
    (r) =>
      [
        r.user_id_1 == userId ? r.user_id_2 : r.user_id_1,
        {
          score: r.score,
          // Null until the pair is recomputed on a build that writes the range.
          low: r.score_low ?? undefined,
          high: r.score_high ?? undefined,
          sharedAnswers: r.shared_answers ?? undefined,
        },
      ] as const,
  )

  const profileCompatibilityScores = Object.fromEntries(scores)

  // console.log('scores', profileCompatibilityScores)

  return {
    status: 'success',
    profileCompatibilityScores,
  }
}
