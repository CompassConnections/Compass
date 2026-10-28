import {type APIHandler} from 'api/helpers/endpoint'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The caller's own saved searches, newest first.
 *
 * Takes no member id on purpose: saved searches are private to the person who saved them (the
 * filters say what someone is looking for), and the only reader is their own search page. The web
 * used to read `bookmarked_searches` straight from PostgREST, where the table was readable by anyone.
 */
export const getBookmarkedSearches: APIHandler<'get-bookmarked-searches'> = async (
  _props,
  auth,
) => {
  const pg = createSupabaseDirectClient()

  const searches = await pg.manyOrNone<Row<'bookmarked_searches'>>(
    `select * from bookmarked_searches
     where creator_id = $1
     order by id desc`,
    [auth.uid],
  )

  return {searches}
}
