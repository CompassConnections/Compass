import {APIError, APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'
import {tryCatch} from 'common/util/try-catch'
import {OPTION_TABLES} from 'common/profiles/constants'

export const getOptions: APIHandler<'get-options'> = async ({table}, _auth) => {
  if (!OPTION_TABLES.includes(table)) throw new APIError(400, 'Invalid table')

  const pg = createSupabaseDirectClient()

  const result = await tryCatch(
    pg.manyOrNone<{name: string}>(`SELECT interests.name
                                      FROM interests`),
  )

  if (result.error) {
    log('Error getting profile options', result.error)
    throw new APIError(500, 'Error getting profile options')
  }

  const names = result.data.map((row) => row.name)
  return {names}
}
