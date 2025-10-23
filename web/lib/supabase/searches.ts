import {Row, run} from "common/supabase/utils";
import {db} from "web/lib/supabase/db";
import {filterKeys} from "web/components/questions-form";
import {track} from "web/lib/service/analytics";
import {removeNullOrUndefinedProps} from "common/util/object";
import {FilterFields} from "common/filters";
import {api} from "web/lib/api";


export const getUserBookmarkedSearches = async (userId: string) => {
  const {data} = await run(
    db
      .from('bookmarked_searches')
      .select('*')
      .eq('creator_id', userId)
      .order('id', {ascending: false})
  )
  return data
}

export type BookmarkedSearchSubmitType = Omit<
  Row<'bookmarked_searches'>,
  'created_time' | 'id' | 'last_notified_at' | 'creator_id'
>

export const submitBookmarkedSearch = async (
  filters: Partial<FilterFields>,
  locationFilterProps: any,
  userId: string | undefined | null,
) => {
  if (!filters) return
  if (!userId) return

  const row = {
    search_filters: removeNullOrUndefinedProps(filters),
    location: locationFilterProps?.location ? locationFilterProps : null,
  }
  const props = {
    ...filterKeys(row, (key, _) => !['id', 'created_time', 'last_notified_at', 'creator_id'].includes(key)),
  } as BookmarkedSearchSubmitType

  await api('create-bookmarked-search', props)
}

export const deleteBookmarkedSearch = async (
  id: number,
) => {
  if (!id) return
  await api('delete-bookmarked-search', {id})
  track('bookmarked_searches delete', {id})
}