import {Profile} from 'common/profiles/profile'
import {updatePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {
  invalidateProfilesCache,
  PROFILE_COUNT_CACHE_KEY,
  PROFILES_ARGS_CACHE_KEY,
  PROFILES_CACHE_KEY,
  removeProfileFromCache,
} from 'web/hooks/use-profiles'

/**
 * Blocking happens on a profile page, with the browse grid unmounted but its result set still in
 * memory — so the thing worth pinning is that the cache and the count it is displayed with stay in
 * step, including the cases where there is nothing to remove. A cache that silently kept the count
 * it started with would show "42 profiles" above 41 cards.
 */

const profile = (userId: string) => ({user_id: userId}) as Profile

const seed = <T>(key: string, value: T) => updatePersistentInMemoryState<T>(key, () => value)

const read = <T>(key: string) => {
  let seen: T | undefined
  updatePersistentInMemoryState<T>(key, (prev) => {
    seen = prev
    return prev
  })
  return seen
}

const clear = (key: string) => updatePersistentInMemoryState(key, () => undefined)

beforeEach(() => {
  ;[PROFILES_CACHE_KEY, PROFILE_COUNT_CACHE_KEY, PROFILES_ARGS_CACHE_KEY].forEach(clear)
})

describe('removeProfileFromCache', () => {
  it('drops the blocked profile and decrements the count', () => {
    seed(PROFILES_CACHE_KEY, [profile('a'), profile('b'), profile('c')])
    seed(PROFILE_COUNT_CACHE_KEY, 3)

    removeProfileFromCache('b')

    expect(read<Profile[]>(PROFILES_CACHE_KEY)?.map((p) => p.user_id)).toEqual(['a', 'c'])
    expect(read<number>(PROFILE_COUNT_CACHE_KEY)).toBe(2)
  })

  it('leaves the count alone when the blocked profile was not in the cache', () => {
    seed(PROFILES_CACHE_KEY, [profile('a')])
    seed(PROFILE_COUNT_CACHE_KEY, 1)

    removeProfileFromCache('b')

    expect(read<Profile[]>(PROFILES_CACHE_KEY)?.map((p) => p.user_id)).toEqual(['a'])
    expect(read<number>(PROFILE_COUNT_CACHE_KEY)).toBe(1)
  })

  it('no-ops when the grid has never been visited', () => {
    expect(() => removeProfileFromCache('b')).not.toThrow()
    expect(read<Profile[]>(PROFILES_CACHE_KEY)).toBeUndefined()
    expect(read<number>(PROFILE_COUNT_CACHE_KEY)).toBeUndefined()
  })

  it('never takes the count below zero', () => {
    seed(PROFILES_CACHE_KEY, [profile('a')])
    seed(PROFILE_COUNT_CACHE_KEY, 0)

    removeProfileFromCache('a')

    expect(read<number>(PROFILE_COUNT_CACHE_KEY)).toBe(0)
  })
})

describe('invalidateProfilesCache', () => {
  it('forgets the fetch arguments, which is what makes the grid refetch', () => {
    seed(PROFILES_ARGS_CACHE_KEY, {limit: 20})

    invalidateProfilesCache()

    expect(read(PROFILES_ARGS_CACHE_KEY)).toBeUndefined()
  })
})
