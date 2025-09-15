import {APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from "shared/supabase/init";
import {convertRow} from "shared/love/supabase";
import {from, join, renderSql, select, where} from "shared/supabase/sql-builder";

export function convertSearchRow(row: any): any {
  return row
}

export const sendSearchNotifications: APIHandler<'send-search-notifications'> = async (_, auth) => {
  const pg = createSupabaseDirectClient()

  const search_query = renderSql(
    select('bookmarked_searches.*'),
    from('bookmarked_searches'),
  )
  const searches = pg.map(search_query, [], convertSearchRow)

  const query = renderSql(
    select('lovers.*, name, username, users.data as user'),
    from('lovers'),
    join('users on users.id = lovers.user_id'),
    where('looking_for_matches = true'),
    where(
      `(data->>'isBannedFromPosting' != 'true' or data->>'isBannedFromPosting' is null)`
    ),
    where(`data->>'userDeleted' != 'true' or data->>'userDeleted' is null`),
  )

  const profiles = await pg.map(query, [], convertRow)

  return {status: 'success', lovers: profiles}
}