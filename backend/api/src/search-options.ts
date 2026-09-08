import {APIHandler} from 'api/helpers/endpoint'
import {DEFAULT_OPTIONS_SHOWN, validateTable} from 'common/profiles/options'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {searchOptions} from 'shared/supabase/options'

/**
 * Ranked search over one option table, and the picker's default view when `q` is empty.
 *
 * This replaces the browser doing `String.prototype.includes` over a client-side copy of the entire
 * table. That copy was the reason two things were true at once: typing "computer programming" could
 * not find "Programming", and every visitor downloaded every option ever created before they could
 * filter on any of them. Both get worse in exactly the direction a user-creatable taxonomy grows.
 */
export const searchOptionsEndpoint: APIHandler<'search-options'> = async (props) => {
  const {table, q, locale, limit, offset, ids} = props
  validateTable(table)

  const pg = createSupabaseDirectClient()
  return await searchOptions(pg, table, {
    q,
    locale,
    limit: limit ?? DEFAULT_OPTIONS_SHOWN,
    offset: offset ?? 0,
    ids: ids as string[] | undefined,
  })
}
