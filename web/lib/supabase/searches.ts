import {Row, run} from "common/supabase/utils";
import {db} from "web/lib/supabase/db";
import {filterKeys} from "web/components/questions-form";
import {track} from "web/lib/service/analytics";
import {FilterFields} from "web/components/filters/search";


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
  'created_time' | 'id' | 'last_notified_at'
>

export const submitBookmarkedSearch = async (
  filters: Partial<FilterFields>,
  locationFilterProps: any,
  userId: string | undefined | null,
) => {
  if (!filters) return
  if (!userId) return

  const row = {search_filters: filters, location: locationFilterProps, creator_id: userId}
  const input = {
    ...filterKeys(row, (key, _) => !['id', 'created_time', 'last_notified_at'].includes(key)),
  } as BookmarkedSearchSubmitType

  await run(
    db.from('bookmarked_searches').upsert(input)
  ).then(() => {
    track('bookmarked_searches submit', {...filters})
  })
}

export const deleteBookmarkedSearch = async (
  id: number,
) => {
  if (!id) return
  await run(
    db.from('bookmarked_searches').delete().eq('id', id)
  ).then(() => {
    track('bookmarked_searches delete', {id})
  })
}