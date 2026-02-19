import {type APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getCompatibleProfilesHandler: APIHandler<'compatible-profiles'> = async (props) => {
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
    (r) => [r.user_id_1 == userId ? r.user_id_2 : r.user_id_1, {score: r.score}] as const,
  )

  const profileCompatibilityScores = Object.fromEntries(scores)

  // console.log('scores', profileCompatibilityScores)

  return {
    status: 'success',
    profileCompatibilityScores,
  }
}
