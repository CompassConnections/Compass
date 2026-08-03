import {hasSearchCriteria} from 'common/filters'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const createBookmarkedSearch: APIHandler<'create-bookmarked-search'> = async (
  props,
  auth,
) => {
  const creator_id = auth.uid
  const {search_filters, location = null, search_name = null} = props

  // An unfiltered search matches every new member, so it would alert forever and tell them nothing.
  // The button is disabled for this, but the rule belongs here too — the button is not the only caller.
  if (!hasSearchCriteria(search_filters, location)) {
    throw APIErrors.badRequest('Set at least one filter before saving a search alert')
  }

  const pg = createSupabaseDirectClient()

  const inserted = await pg.one(
    `
      INSERT INTO bookmarked_searches (creator_id, search_filters, location, search_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [creator_id, search_filters, location, search_name],
  )

  return inserted
}
