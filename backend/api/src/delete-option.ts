import {APIHandler} from 'api/helpers/endpoint'
import {APIErrors} from 'common/api/utils'
import {validateTable} from 'common/profiles/options'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Removes an option outright, from `/admin/options`.
 *
 * The destructive one, and destructive in a way merge is not. Merge moves people to an option that
 * means the same thing; this takes the tag off every profile holding it and gives them nothing back.
 * "Veganism" in the 2026-08-07 script is the shape of it — an option that should never have been in
 * this taxonomy, whose holders were left with nothing a search for it could find. Reach for merge
 * unless the option genuinely should not exist.
 *
 * No alias is recorded, deliberately. An alias redirects a name to an option that means it, and after
 * this there is nothing for the name to mean. The option's existing aliases cascade away for the same
 * reason: a redirect to a deleted row would be a link to nowhere, and the names become creatable
 * again, which is the honest outcome.
 *
 * `expectedUsageCount` is required rather than optional. The whole safeguard here is that the caller
 * looked at how many people this costs, and a count read from a page loaded ten minutes ago is
 * exactly the one that quietly understates it.
 */
export const deleteOption: APIHandler<'delete-option'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)
  const {table, optionId, expectedUsageCount} = props
  validateTable(table)

  const pg = createSupabaseDirectClient()

  const current = await pg.oneOrNone<{name: string; usage_count: number}>(
    `select name, usage_count from ${table} where id = $(optionId)::bigint`,
    {optionId},
  )
  if (!current) throw APIErrors.notFound('No such option')

  const usageCount = Number(current.usage_count ?? 0)
  if (usageCount !== expectedUsageCount) {
    throw APIErrors.conflict(
      `"${current.name}" is now held by ${usageCount} profile(s), not ${expectedUsageCount}. ` +
        `Reload and look again before deleting it.`,
    )
  }

  // Cascades to profile_<table>, <table>_translations and <table>_aliases. The per-row delete trigger
  // on profile_<table> fires through the cascade, so every holder's `search_text` is rebuilt without
  // the option — the reason this is a plain DELETE and not a hand-rolled cleanup.
  await pg.none(`delete from ${table} where id = $(optionId)::bigint`, {optionId})

  return {name: current.name, removedFrom: usageCount}
}
