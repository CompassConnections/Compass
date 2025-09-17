import { groupBy, sortBy } from 'lodash'
import { APIError, type APIHandler } from 'api/helpers/endpoint'
import { getCompatibilityScore } from 'common/love/compatibility-score'
import {
  getProfile,
  getCompatibilityAnswers,
  getGenderCompatibleProfiles,
} from 'shared/love/supabase'
import { log } from 'shared/utils'

export const getCompatibleProfilesHandler: APIHandler<
  'compatible-profiles'
> = async (props) => {
  return getCompatibleProfiles(props.userId)
}

export const getCompatibleProfiles = async (userId: string) => {
  const lover = await getProfile(userId)

  log('got lover', {
    id: lover?.id,
    userId: lover?.user_id,
    username: lover?.user?.username,
  })

  if (!lover) throw new APIError(404, 'Profile not found')

  const profiles = await getGenderCompatibleProfiles(lover)

  const loverAnswers = await getCompatibilityAnswers([
    userId,
    ...profiles.map((l) => l.user_id),
  ])
  log('got lover answers ' + loverAnswers.length)

  const answersByUserId = groupBy(loverAnswers, 'creator_id')
  const loverCompatibilityScores = Object.fromEntries(
    profiles.map(
      (l) =>
        [
          l.user_id,
          getCompatibilityScore(
            answersByUserId[lover.user_id] ?? [],
            answersByUserId[l.user_id] ?? []
          ),
        ] as const
    )
  )

  const sortedCompatibleProfiles = sortBy(
    profiles,
    (l) => loverCompatibilityScores[l.user_id].score
  ).reverse()

  return {
    status: 'success',
    lover,
    compatibleProfiles: sortedCompatibleProfiles,
    loverCompatibilityScores,
  }
}
