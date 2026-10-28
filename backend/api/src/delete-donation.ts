import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/** Undo for a mistyped row. A hard delete: there is nothing downstream of a donation but its sum. */
export const deleteDonation: APIHandler<'delete-donation'> = async ({id}, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const pg = createSupabaseDirectClient()

  const deleted = await pg.result(`delete from donations where id = $(id)`, {id}, (r) => r.rowCount)
  if (!deleted) throw APIErrors.notFound('No such donation')

  return {success: true}
}
