import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {Row} from 'common/supabase/utils'
import {useEffect} from 'react'
import {getUserBookmarkedSearches} from 'web/lib/supabase/searches'

export const useBookmarkedSearches = (userId: string | undefined) => {
  const [bookmarkedSearches, setBookmarkedSearches] = usePersistentInMemoryState<
    Row<'bookmarked_searches'>[]
  >([], `bookmarked-searches-${userId}`)

  useEffect(() => {
    if (userId) getUserBookmarkedSearches(userId).then(setBookmarkedSearches)
  }, [userId])

  async function refreshBookmarkedSearches() {
    if (userId) getUserBookmarkedSearches(userId).then(setBookmarkedSearches)
  }

  return {bookmarkedSearches, refreshBookmarkedSearches}
}

export type BookmarkedSearchesType = Row<'bookmarked_searches'>
