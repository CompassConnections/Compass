import { sortBy } from 'lodash'
import { useEffect } from 'react'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { api } from 'web/lib/api'
import { APIResponse } from 'common/api/schema'
import { useProfileByUserId } from './use-lover'
import { getProfilesCompatibilityFactor } from 'common/love/compatibility-score'

export const useCompatibleProfiles = (
  userId: string | null | undefined,
  options?: { sortWithModifiers?: boolean }
) => {
  const [data, setData] = usePersistentInMemoryState<
    APIResponse<'compatible-profiles'> | undefined | null
  >(undefined, `compatible-profiles-${userId}`)

  const lover = useProfileByUserId(userId ?? undefined)

  useEffect(() => {
    if (userId) {
      api('compatible-profiles', { userId })
        .then(setData)
        .catch((e) => {
          if (e.code === 404) {
            setData(null)
          } else {
            throw e
          }
        })
    } else if (userId === null) setData(null)
  }, [userId])

  if (data && lover && options?.sortWithModifiers) {
    data.compatibleProfiles = sortBy(data.compatibleProfiles, (l) => {
      const modifier = !lover ? 1 : getProfilesCompatibilityFactor(lover, l)
      return -1 * modifier * data.loverCompatibilityScores[l.user.id].score
    })
  }

  return data
}
