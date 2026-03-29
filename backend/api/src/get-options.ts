import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {OptionTableKey} from 'common/profiles/constants'
import {validateTable} from 'common/profiles/options'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {log} from 'shared/utils'

export async function getOptions(table: OptionTableKey, locale?: string): Promise<string[]> {
  validateTable(table)

  const pg = createSupabaseDirectClient()

  let query: string
  const params: any[] = []

  if (locale) {
    // Get translated options for the specified locale
    const translationTable = `${table}_translations`
    query = `
      SELECT COALESCE(t.name, o.name) as name
      FROM ${table} o
      LEFT JOIN ${translationTable} t ON o.id = t.option_id AND t.locale = $1
      ORDER BY o.id
    `
    params.push(locale)
  } else {
    // Get default options (fallback to English)
    query = `SELECT name FROM ${table} ORDER BY id`
  }

  const result = await tryCatch(pg.manyOrNone<{name: string}>(query, params))

  if (result.error) {
    log('Error getting profile options', result.error)
    throw APIErrors.internalServerError('Error getting profile options')
  }

  return result.data.map((row) => row.name)
}

export const getOptionsEndpoint: APIHandler<'get-options'> = async ({table, locale}, _auth) => {
  const names = await getOptions(table, locale)
  return {names}
}
