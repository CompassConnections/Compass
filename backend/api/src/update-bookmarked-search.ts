import {hasSearchCriteria} from 'common/filters'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

// Rewrites a saved search in place. Keeping the row's id is the point: the alert history links to it,
// and its notification watermarks carry on, so editing is not "delete and save again" — which would
// also trip the per-member cap for anyone already at it.
export const updateBookmarkedSearch: APIHandler<'update-bookmarked-search'> = async (
  props,
  auth,
) => {
  const creator_id = auth.uid
  const {id, search_filters, location = null} = props

  // Same rule as on create: an unfiltered search would alert on every signup and tell them nothing.
  if (!hasSearchCriteria(search_filters, location)) {
    throw APIErrors.badRequest('Set at least one filter before saving a search alert')
  }

  const pg = createSupabaseDirectClient()

  // Only your own: the where clause doubles as the ownership check, so someone else's id just
  // matches nothing.
  const updated = await pg.oneOrNone(
    `
      UPDATE bookmarked_searches
      SET search_filters = $1, location = $2
      WHERE id = $3 AND creator_id = $4
      RETURNING *
    `,
    [search_filters, location, id, creator_id],
  )
  if (!updated) throw APIErrors.notFound('Saved search not found')

  return updated
}
