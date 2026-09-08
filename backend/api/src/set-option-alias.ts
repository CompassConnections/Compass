import {APIHandler} from 'api/helpers/endpoint'
import {APIErrors} from 'common/api/utils'
import {normalizeOptionName, optionNameProblem} from 'common/profiles/option-name'
import {validateTable} from 'common/profiles/options'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {resolveOptionName} from 'shared/supabase/options'

/**
 * Adds or removes one alias, for the abbreviations and spellings a merge never produces.
 *
 * "AI" -> "Artificial intelligence" is the shape this exists for: nobody ever created "AI" as its own
 * option, so there is nothing to merge, but people type it and would otherwise create it. No thesaurus
 * carries that pair either — it is an abbreviation, not a synonym — which is why this is a curated
 * list rather than something generated.
 */
export const setOptionAlias: APIHandler<'set-option-alias'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  const {table, optionId, remove} = props
  validateTable(table)

  const alias = normalizeOptionName(props.alias)
  const problem = optionNameProblem(alias)
  if (problem) throw APIErrors.badRequest(`That alias cannot be used: ${problem}`)

  const pg = createSupabaseDirectClient()

  if (remove) {
    await pg.none(
      `delete from ${table}_aliases where option_id = $(optionId)::bigint and lower(alias) = lower($(alias))`,
      {optionId, alias},
    )
    return {alias}
  }

  // An alias that is already a live option would leave two rows claiming one identity, and the alias
  // lookup would then depend on which one resolution happened to reach first. That case is a merge,
  // and saying so is more useful than silently creating the ambiguity.
  const existing = await resolveOptionName(pg, table, alias)
  if (existing && existing.matchedOn === 'name') {
    throw APIErrors.conflict(
      `"${alias}" is already an option in its own right — merge it instead of aliasing it.`,
    )
  }

  await pg.none(
    `insert into ${table}_aliases (option_id, alias)
     values ($(optionId)::bigint, $(alias))
     on conflict do nothing`,
    {optionId, alias},
  )
  return {alias}
}
