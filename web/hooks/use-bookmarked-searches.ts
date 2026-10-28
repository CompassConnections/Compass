import {Row} from 'common/supabase/utils'
import {useMemo} from 'react'
import {useAPIGetter} from 'web/hooks/use-api-getter'

const NONE: Row<'bookmarked_searches'>[] = []

export const useBookmarkedSearches = (userId: string | undefined) => {
  // The endpoint only ever returns the caller's own searches; `userId` just says whether there is a
  // signed-in caller to ask for yet.
  const {data, refresh} = useAPIGetter('get-bookmarked-searches', userId ? {} : undefined)
  const bookmarkedSearches = useMemo(() => data?.searches ?? NONE, [data])

  return {bookmarkedSearches, refreshBookmarkedSearches: refresh}
}

export type BookmarkedSearchesType = Row<'bookmarked_searches'>
