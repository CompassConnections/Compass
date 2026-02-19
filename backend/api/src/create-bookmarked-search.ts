import {APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const createBookmarkedSearch: APIHandler<'create-bookmarked-search'> = async (
  props,
  auth,
) => {
  const creator_id = auth.uid
  const {search_filters, location = null, search_name = null} = props

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
