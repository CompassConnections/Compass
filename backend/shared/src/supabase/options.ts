import {APIErrors} from 'common/api/utils'
import {OPTION_TABLES, OptionTableKey} from 'common/profiles/constants'
import {normalizeOptionName} from 'common/profiles/option-name'
import {OPTION_SIMILARITY_THRESHOLD, OptionSummary} from 'common/profiles/options'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

interface CacheEntry {
  data: Record<OptionTableKey, Record<string, string>>
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

export async function getOptionsIdsToLabels(locale: string = 'en') {
  const cacheKey = `options-${locale}`
  const now = Date.now()

  const cached = cache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  // console.log("Fetching getOptionsIdsToLabels...")
  const pg = createSupabaseDirectClient()
  const result: Record<OptionTableKey, Record<string, string>> = {} as Record<
    OptionTableKey,
    Record<string, string>
  >

  for (const tableKey of OPTION_TABLES) {
    // const rows = await pg.manyOrNone(`
    //   SELECT
    //     id,
    //     COALESCE(
    //       (${tableKey}_translations.name) FILTER (WHERE ${tableKey}_translations.locale = $1),
    //       name
    //     ) as name
    //   FROM ${tableKey}
    //   LEFT JOIN ${tableKey}_translations ON ${tableKey}.id = ${tableKey}_translations.id
    //   ORDER BY name ASC
    // `, [locale])
    const rows = await pg.manyOrNone(
      `SELECT id, name
                                      FROM ${tableKey}
                                      ORDER BY name`,
      [locale],
    )

    const idToName: Record<string, string> = {}
    rows.forEach((row) => (idToName[row.id] = row.name))
    result[tableKey] = idToName
  }

  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  })
  // console.log({result})
  return result
}

/**
 * Everything below is the de-duplication path for the user-creatable taxonomies. See
 * `20260907_canonical_options.sql` for the schema it assumes and why it exists; the short version is
 * that these tables used to dedupe on byte-exact string equality behind an index named `_ci` that
 * did no case folding, so "Gaming" and "gaming" were two options.
 *
 * Every query here interpolates `table` directly. That is safe only because `OptionTableKey` is a
 * three-value union and `validateTable` rejects anything else — the same reason the existing
 * `profile_${table}` queries do it. Do not widen it to a caller-supplied string.
 */

/** Escapes the wildcards ILIKE would otherwise read as a pattern, so a typed `%` matches a literal `%`. */
const forIlike = (term: string) => term.replace(/([\\%_])/g, '\\$1')

/**
 * The existing option a typed name refers to, or `null` if there is none.
 *
 * Three chances to *not* create a duplicate, in order of confidence: the canonical name, the same
 * name in any casing, and a name that used to be its own option before being merged away. The last
 * is what stops the 2026-08-07 merge from being undone by the next person to type "Gaming".
 */
export async function resolveOptionName(
  tx: SupabaseDirectClient,
  table: OptionTableKey,
  rawName: string,
  locale = 'en',
): Promise<{option: OptionSummary; matchedOn: 'name' | 'alias'} | null> {
  const name = normalizeOptionName(rawName)
  if (!name) return null

  const row = await tx.oneOrNone<OptionRow & {src: number}>(
    `with matches as (select o.id, 0 as src
                      from ${table} o
                      where lower(o.name) = lower($(name))
                      union all
                      select o.id, 1 as src
                      from ${table}_aliases a
                               join ${table} o on o.id = a.option_id
                      where lower(a.alias) = lower($(name)))
     select o.id,
            coalesce(tr.name, o.name) as name,
            o.usage_count,
            m.src
     from matches m
              join ${table} o on o.id = m.id
              left join ${table}_translations tr on tr.option_id = o.id and tr.locale = $(locale)
     order by m.src
     limit 1`,
    {name, locale},
  )
  if (!row) return null
  return {option: toOptionSummary(row), matchedOn: row.src === 0 ? 'name' : 'alias'}
}

/**
 * Creates the option, or returns the existing one if it is already there under any casing.
 *
 * `on conflict (lower(name))` targets the unique expression index that replaced the old
 * `*_name_unique` constraint. The no-op `do update` (rather than `do nothing`) is what makes
 * `returning id` produce a row in the conflict case.
 */
export async function createOption(
  tx: SupabaseDirectClient,
  table: OptionTableKey,
  rawName: string,
  creatorId: string,
): Promise<{id: string; name: string}> {
  const name = normalizeOptionName(rawName)
  const row = await tx.one<{id: string; name: string}>(
    `insert into ${table} (name, creator_id)
     values ($(name), $(creatorId))
     on conflict (lower(name)) do update set name = ${table}.name
     returning id, name`,
    {name, creatorId},
  )
  return {id: String(row.id), name: row.name}
}

/**
 * Ranked option search, and the picker's default view when `q` is empty.
 *
 * Ordering is (match tier, then popularity). Popularity as the tie-break is the whole point: the old
 * picker sorted alphabetically, which put "Runcorn history" above "Running" for someone typing "run"
 * and told the reader nothing about which options anyone actually uses. Leading with the popular one
 * is also the cheapest force pushing the taxonomy back together, since a reader offered a well-used
 * option usually takes it instead of typing a near-synonym.
 *
 * The tiers exist because a single `ILIKE '%q%'` is both too narrow and too flat: too narrow because
 * it never finds "Programming" for "computer programming", and too flat because it cannot tell an
 * exact hit from an incidental substring. Trigram similarity (tier 5) covers typos and word-order
 * differences; aliases (tiers 1 and 6) cover synonyms and merged-away names, which is where "AI"
 * finds "Artificial intelligence" — a thesaurus never would, since that pair is an abbreviation
 * rather than a synonym.
 */
export async function searchOptions(
  tx: SupabaseDirectClient,
  table: OptionTableKey,
  params: {q?: string; locale?: string; limit: number; offset: number; ids?: string[]},
): Promise<{options: OptionSummary[]; total: number}> {
  const {q, locale = 'en', limit, offset, ids} = params
  const term = normalizeOptionName(q ?? '')

  // Ticked options are pinned into the response whatever the query matches, so a selected chip can
  // never disappear from under the reader — and so a filter restored from a bookmarked search can
  // still render its own name even when it is far too rare to be on the first page.
  const pinned = ids?.length
    ? await tx.manyOrNone<OptionRow>(
        `select o.id, coalesce(tr.name, o.name) as name, o.usage_count
         from ${table} o
                  left join ${table}_translations tr on tr.option_id = o.id and tr.locale = $(locale)
         where o.id = any ($(ids)::bigint[])
         order by o.usage_count desc, name`,
        {locale, ids: ids.map(Number).filter((n) => !isNaN(n))},
      )
    : []

  const rows = term
    ? await tx.manyOrNone<OptionRow & {total: string}>(
        `with base as (select o.id,
                              coalesce(tr.name, o.name) as display,
                              o.name                    as canonical,
                              o.usage_count
                       from ${table} o
                                left join ${table}_translations tr
                                          on tr.option_id = o.id and tr.locale = $(locale)),
              matched as (select b.*,
                                 case
                                     when lower(b.display) = lower($(term))
                                         or lower(b.canonical) = lower($(term)) then 0
                                     when exists (select 1
                                                  from ${table}_aliases a
                                                  where a.option_id = b.id
                                                    and lower(a.alias) = lower($(term))) then 1
                                     when b.display ilike $(prefix) escape '\\'
                                         or b.canonical ilike $(prefix) escape '\\' then 2
                                     when b.display ilike $(wordPrefix) escape '\\' then 3
                                     when b.display ilike $(contains) escape '\\'
                                         or b.canonical ilike $(contains) escape '\\' then 4
                                     when greatest(similarity(b.display, $(term)),
                                                   similarity(b.canonical, $(term))) >= $(threshold) then 5
                                     when exists (select 1
                                                  from ${table}_aliases a
                                                  where a.option_id = b.id
                                                    and similarity(a.alias, $(term)) >= $(threshold)) then 6
                                     end as tier
                          from base b)
         select id, display as name, usage_count, count(*) over () as total
         from matched
         where tier is not null
           and not (id = any ($(excludeIds)::bigint[]))
         order by tier, usage_count desc, display
         limit $(limit) offset $(offset)`,
        {
          locale,
          term,
          prefix: `${forIlike(term)}%`,
          wordPrefix: `% ${forIlike(term)}%`,
          contains: `%${forIlike(term)}%`,
          threshold: OPTION_SIMILARITY_THRESHOLD,
          excludeIds: pinned.map((p) => Number(p.id)),
          limit,
          offset,
        },
      )
    : await tx.manyOrNone<OptionRow & {total: string}>(
        `select o.id,
                coalesce(tr.name, o.name) as name,
                o.usage_count,
                count(*) over ()          as total
         from ${table} o
                  left join ${table}_translations tr on tr.option_id = o.id and tr.locale = $(locale)
         where not (o.id = any ($(excludeIds)::bigint[]))
         order by o.usage_count desc, name
         limit $(limit) offset $(offset)`,
        {locale, excludeIds: pinned.map((p) => Number(p.id)), limit, offset},
      )

  return {
    // Pinned rows lead only on the default view. Once someone is typing, the results they asked for
    // come first and an unrelated ticked chip would just be noise at the top of them.
    options: [...(term ? [] : pinned), ...rows].map(toOptionSummary),
    total: Number(rows[0]?.total ?? 0) + pinned.length,
  }
}

/**
 * The closest existing options to a name that matched nothing exactly — the shortlist behind
 * "Did you mean Programming?".
 *
 * Ordered by similarity rather than popularity, because here the reader has already been shown the
 * popular ones and rejected them by typing something else; what matters now is which option is
 * actually the same thing.
 */
export async function findSimilarOptions(
  tx: SupabaseDirectClient,
  table: OptionTableKey,
  rawName: string,
  locale = 'en',
  limit = 20,
): Promise<OptionSummary[]> {
  const name = normalizeOptionName(rawName)
  if (!name) return []

  const rows = await tx.manyOrNone<OptionRow>(
    `select o.id,
            coalesce(tr.name, o.name) as name,
            o.usage_count
     from ${table} o
              left join ${table}_translations tr on tr.option_id = o.id and tr.locale = $(locale)
     where similarity(coalesce(tr.name, o.name), $(name)) >= $(threshold)
        -- Either direction of containment. The second is the headline case this whole endpoint
        -- exists for: someone types "Computer programming" and "Programming" is already an option,
        -- which no substring search over the *existing* names would ever surface.
        or position(lower($(name)) in lower(coalesce(tr.name, o.name))) > 0
        or position(lower(coalesce(tr.name, o.name)) in lower($(name))) > 0
     order by similarity(coalesce(tr.name, o.name), $(name)) desc, o.usage_count desc
     limit $(limit)`,
    {
      locale,
      name,
      threshold: OPTION_SIMILARITY_THRESHOLD,
      limit,
    },
  )
  return rows.map(toOptionSummary)
}

type OptionRow = {id: string; name: string; usage_count: number}

const toOptionSummary = (row: OptionRow): OptionSummary => ({
  id: String(row.id),
  name: row.name,
  usageCount: Number(row.usage_count ?? 0),
})

/**
 * Folds `fromId` into `intoId`: holders move over, the dead name becomes an alias, the row is deleted.
 *
 * Holders are moved with INSERT ... ON CONFLICT DO NOTHING followed by the cascading DELETE, rather
 * than `UPDATE profile_x SET option_id`, because the rebuild triggers on `profile_*` fire on INSERT
 * and DELETE only — repointing in place would move everyone's tick and leave their `search_text`
 * still quoting the old name.
 *
 * The alias row is what stops the merge from being undone by the next person to type the dead name,
 * and is why this is a single function rather than three statements at a call site: a merge without
 * it is the temporary kind the 2026-08-07 script warned about.
 */
export async function mergeOptions(
  tx: SupabaseDirectClient,
  table: OptionTableKey,
  fromId: string,
  intoId: string,
): Promise<{moved: number; alreadyHad: number; aliases: string[]}> {
  if (fromId === intoId) throw APIErrors.badRequest('An option cannot be merged into itself')

  const [from, into] = await Promise.all([
    tx.oneOrNone<OptionRow>(`select id, name, usage_count from ${table} where id = $(id)::bigint`, {
      id: fromId,
    }),
    tx.oneOrNone<OptionRow>(`select id, name, usage_count from ${table} where id = $(id)::bigint`, {
      id: intoId,
    }),
  ])
  if (!from) throw APIErrors.notFound('The option being merged away does not exist')
  if (!into) throw APIErrors.notFound('The option being merged into does not exist')

  const moved = await tx.one<{count: string}>(
    `with moved as (
       insert into profile_${table} (profile_id, option_id)
       select po.profile_id, $(intoId)::bigint
       from profile_${table} po
       where po.option_id = $(fromId)::bigint
       on conflict (profile_id, option_id) do nothing
       returning 1)
     select count(*) as count from moved`,
    {fromId, intoId},
  )

  // Recorded before the delete, and the loser's own aliases come along: without that, a second merge
  // of an already-merged option would silently drop the names the first one rescued.
  const aliases = await tx.manyOrNone<{alias: string}>(
    `insert into ${table}_aliases (option_id, alias)
     select $(intoId)::bigint, a.alias
     from ${table}_aliases a
     where a.option_id = $(fromId)::bigint
     union
     select $(intoId)::bigint, $(fromName)::text
     on conflict do nothing
     returning alias`,
    {fromId, intoId, fromName: from.name},
  )

  await tx.none(`delete from ${table} where id = $(fromId)::bigint`, {fromId})

  return {
    moved: Number(moved.count),
    alreadyHad: Number(from.usage_count ?? 0) - Number(moved.count),
    aliases: aliases.map((a) => a.alias),
  }
}

/** Every alias in one table, grouped by the option it points at. */
export async function getOptionAliases(
  tx: SupabaseDirectClient,
  table: OptionTableKey,
): Promise<Record<string, string[]>> {
  const rows = await tx.manyOrNone<{option_id: string; alias: string}>(
    `select option_id, alias from ${table}_aliases order by alias`,
  )
  const byOption: Record<string, string[]> = {}
  for (const row of rows) (byOption[String(row.option_id)] ??= []).push(row.alias)
  return byOption
}
