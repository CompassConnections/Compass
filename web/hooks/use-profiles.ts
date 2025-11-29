import {useEffect} from 'react'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {api} from 'web/lib/api'
import {APIResponse} from 'common/api/schema'

export const useCompatibleProfiles = (
  userId: string | null | undefined,
) => {
  const [data, setData] = usePersistentInMemoryState<
    APIResponse<'compatible-profiles'> | undefined | null
  >(undefined, `compatible-profiles-${userId}`)

  useEffect(() => {
    if (userId) {
      api('compatible-profiles', {userId})
        .then(setData)
        .catch((e) => {
          if (e.code === 404) {
            setData(null)
          } else {
            throw e
          }
        })
    } else if (userId === null) {
      setData(null)
    }
  }, [userId])

  return data
}
