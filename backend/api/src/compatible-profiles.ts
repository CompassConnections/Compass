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
  const profile = await getProfile(userId)

  log('got profile', {
    id: profile?.id,
    userId: profile?.user_id,
    username: profile?.user?.username,
  })

  if (!profile) throw new APIError(404, 'Profile not found')

  const profiles = await getGenderCompatibleProfiles(profile)

  const profileAnswers = await getCompatibilityAnswers([
    userId,
    ...profiles.map((l) => l.user_id),
  ])
  log('got profile answers ' + profileAnswers.length)

  const answersByUserId = groupBy(profileAnswers, 'creator_id')
  const profileCompatibilityScores = Object.fromEntries(
    profiles.map(
      (l) =>
        [
          l.user_id,
          getCompatibilityScore(
            answersByUserId[profile.user_id] ?? [],
            answersByUserId[l.user_id] ?? []
          ),
        ] as const
    )
  )

  const sortedCompatibleProfiles = sortBy(
    profiles,
    (l) => profileCompatibilityScores[l.user_id].score
  ).reverse()

  return {
    status: 'success',
    profile,
    compatibleProfiles: sortedCompatibleProfiles,
    profileCompatibilityScores,
  }
}
