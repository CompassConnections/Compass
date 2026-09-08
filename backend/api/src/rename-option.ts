import {APIHandler} from 'api/helpers/endpoint'
import {APIErrors} from 'common/api/utils'
import {normalizeOptionName, optionNameProblem} from 'common/profiles/option-name'
import {validateTable} from 'common/profiles/options'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {resolveOptionName} from 'shared/supabase/options'

/**
 * Renames one option from `/admin/options`, keeping the old name pointed at it.
 *
 * The rename itself is one UPDATE; everything around it is what makes the rename safe.
 *
 * The old name becomes an alias. A rename is the one operation that can strand a name people already
 * type — "Video games" renamed to "Gaming" leaves everyone who types "Video games" creating a fresh
 * duplicate of the option they were looking at. Recording the alias is what makes the rename a
 * correction rather than a new way to fragment the taxonomy, and it is the reason this is an endpoint
 * rather than an UPDATE somebody runs by hand.
 *
 * Members' `search_text` follows automatically: `trg_<table>_name_search_upd`, added in
 * 20260907_canonical_options.sql, rebuilds every holder's row on a name change. Before that trigger
 * existed, a rename left every profile still quoting the old name in search.
 */
export const renameOption: APIHandler<'rename-option'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  const {table, optionId} = props
  validateTable(table)

  const name = normalizeOptionName(props.name)
  const problem = optionNameProblem(name)
  if (problem) throw APIErrors.badRequest(`That name cannot be used: ${problem}`)

  const pg = createSupabaseDirectClient()

  const current = await pg.oneOrNone<{name: string}>(
    `select name from ${table} where id = $(optionId)::bigint`,
    {optionId},
  )
  if (!current) throw APIErrors.notFound('No such option')

  // Renaming to a name that is already a different option is a merge, and doing it silently would
  // either fail on the unique index or leave two rows claiming one identity. Saying so is more useful
  // than either.
  const existing = await resolveOptionName(pg, table, name)
  if (existing && existing.option.id !== String(optionId)) {
    const how =
      existing.matchedOn === 'name' ? 'already an option' : 'already an alias of another option'
    throw APIErrors.conflict(`"${name}" is ${how} — merge into it instead of renaming onto it.`)
  }

  // A pure re-spelling ("video games" -> "Video games") is the same identity, so there is no stranded
  // name to rescue and an alias would only duplicate the name itself.
  const isRespelling = current.name.toLowerCase() === name.toLowerCase()

  return await pg.tx(async (t) => {
    await t.none(`update ${table} set name = $(name) where id = $(optionId)::bigint`, {
      name,
      optionId,
    })

    if (isRespelling) return {name, aliased: null}

    await t.none(
      `insert into ${table}_aliases (option_id, alias)
       values ($(optionId)::bigint, $(oldName))
       on conflict do nothing`,
      {optionId, oldName: current.name},
    )
    // The new name may itself have been an alias of this option until a moment ago. Leaving that row
    // would mean an option aliasing its own name — harmless to resolution, which checks names first,
    // but noise in a list whose whole job is to be read.
    await t.none(
      `delete from ${table}_aliases where option_id = $(optionId)::bigint and lower(alias) = lower($(name))`,
      {optionId, name},
    )
    return {name, aliased: current.name}
  })
}
