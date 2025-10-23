import {APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const deleteBookmarkedSearch: APIHandler<'delete-bookmarked-search'> = async (
  props,
  auth
) => {
  const creator_id = auth.uid
  const {id} = props

  const pg = createSupabaseDirectClient()

  // Only allow deleting your own bookmarked searches
  await pg.none(
    `
      DELETE FROM bookmarked_searches
      WHERE id = $1 AND creator_id = $2
    `,
    [id, creator_id]
  )

  return {}
}
