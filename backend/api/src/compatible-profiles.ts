import { groupBy, sortBy } from 'lodash'
import { APIError, type APIHandler } from 'api/helpers/endpoint'
import { getCompatibilityScore } from 'common/love/compatibility-score'
import {
  getLover,
  getCompatibilityAnswers,
  getGenderCompatibleLovers,
} from 'shared/love/supabase'
import { log } from 'shared/utils'

export const getCompatibleLoversHandler: APIHandler<
  'compatible-profiles'
> = async (props) => {
  return getCompatibleLovers(props.userId)
}

export const getCompatibleLovers = async (userId: string) => {
  const lover = await getLover(userId)

  log('got lover', {
    id: lover?.id,
    userId: lover?.user_id,
    username: lover?.user?.username,
  })

  if (!lover) throw new APIError(404, 'Lover not found')

  const profiles = await getGenderCompatibleLovers(lover)

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

  const sortedCompatibleLovers = sortBy(
    profiles,
    (l) => loverCompatibilityScores[l.user_id].score
  ).reverse()

  return {
    status: 'success',
    lover,
    compatibleLovers: sortedCompatibleLovers,
    loverCompatibilityScores,
  }
}
