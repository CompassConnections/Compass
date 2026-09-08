import {APIHandler} from 'api/helpers/endpoint'
import {OptionSummary, validateTable} from 'common/profiles/options'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getOptionAliases} from 'shared/supabase/options'

/**
 * Every option in one table with its usage count and its aliases, for `/admin/options`.
 *
 * Unpaged and uncached, unlike the public `search-options`: merging is a whole-table judgement — you
 * are looking for the two rows that should be one — and a page boundary is exactly what hides a
 * duplicate pair from the person hunting it.
 */
export const getOptionsAdmin: APIHandler<'get-options-admin'> = async ({table, locale}, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  validateTable(table)

  const pg = createSupabaseDirectClient()

  const [rows, aliases] = await Promise.all([
    pg.manyOrNone<{id: string; name: string; usage_count: number}>(
      `select o.id, coalesce(tr.name, o.name) as name, o.usage_count
       from ${table} o
                left join ${table}_translations tr on tr.option_id = o.id and tr.locale = $(locale)
       order by o.usage_count desc, name`,
      {locale: locale ?? 'en'},
    ),
    getOptionAliases(pg, table),
  ])

  return {
    options: rows.map((row): OptionSummary & {aliases: string[]} => ({
      id: String(row.id),
      name: row.name,
      usageCount: Number(row.usage_count ?? 0),
      aliases: aliases[String(row.id)] ?? [],
    })),
  }
}
