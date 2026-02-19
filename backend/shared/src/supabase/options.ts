import {createSupabaseDirectClient} from 'shared/supabase/init'
import {OPTION_TABLES, OptionTableKey} from 'common/profiles/constants'

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
