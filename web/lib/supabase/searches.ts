import {FilterFields} from 'common/filters'
import {Row} from 'common/supabase/utils'
import {removeNullOrUndefinedProps} from 'common/util/object'
import {omit} from 'lodash'
import {api} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'

export type BookmarkedSearchSubmitType = Omit<
  Row<'bookmarked_searches'>,
  'created_time' | 'id' | 'last_notified_at' | 'last_checked_at' | 'creator_id'
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
  const props = omit(row, [
    'id',
    'created_time',
    'last_notified_at',
    'last_checked_at',
    'creator_id',
  ]) as BookmarkedSearchSubmitType

  await api('create-bookmarked-search', props)
}

export const deleteBookmarkedSearch = async (id: number) => {
  if (!id) return
  await api('delete-bookmarked-search', {id})
  track('bookmarked_searches delete', {id})
}
