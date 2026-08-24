import {APIResponse} from 'common/api/schema'
import {Profile} from 'common/profiles/profile'
import {useEffect} from 'react'
import {
  updatePersistentInMemoryState,
  usePersistentInMemoryState,
} from 'web/hooks/use-persistent-in-memory-state'
import {api} from 'web/lib/api'

/**
 * Keys the browse grid caches its last result set under (`profiles-home.tsx`). Exported so the
 * cache can be fixed up from elsewhere — see `removeProfileFromCache`.
 */
export const PROFILES_CACHE_KEY = 'profiles'
export const PROFILE_COUNT_CACHE_KEY = 'profile-count'
export const PROFILES_ARGS_CACHE_KEY = 'get-profiles-args'

/**
 * Drops someone from the browse grid's cached result set.
 *
 * The grid keeps its profiles in memory so coming back to it is instant, and skips refetching while
 * the filters are unchanged — so blocking someone from their profile page and hitting back would
 * otherwise show them still sitting in the grid until a reload or a filter change. The server
 * already filters blocks in both directions on the next real fetch; this only keeps the cache from
 * contradicting it in the meantime.
 */
export const removeProfileFromCache = (userId: string) => {
  let removed = 0
  updatePersistentInMemoryState<Profile[]>(PROFILES_CACHE_KEY, (profiles) => {
    if (!profiles) return profiles
    const kept = profiles.filter((profile) => profile.user_id !== userId)
    removed = profiles.length - kept.length
    return kept
  })
  if (!removed) return
  updatePersistentInMemoryState<number>(PROFILE_COUNT_CACHE_KEY, (count) =>
    count === undefined ? count : Math.max(0, count - removed),
  )
}

/**
 * Forgets the arguments the cached result set was fetched with, which is what the grid compares
 * against to decide it can skip a refetch. Use after something the server filters on changes and
 * the cache cannot be patched locally — unblocking, where the profiles to add back are not held
 * anywhere on the client.
 */
export const invalidateProfilesCache = () =>
  updatePersistentInMemoryState(PROFILES_ARGS_CACHE_KEY, () => undefined)

export const useCompatibleProfiles = (userId: string | null | undefined) => {
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
