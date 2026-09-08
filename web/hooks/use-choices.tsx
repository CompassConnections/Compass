import {debug} from 'common/logger'
import {OPTION_TABLES, OptionTableKey} from 'common/profiles/constants'
import {DEFAULT_OPTIONS_SHOWN, OptionSummary} from 'common/profiles/options'
import {keyBy, mapValues, uniqBy} from 'lodash'
import {createContext, ReactNode, useCallback, useContext, useEffect, useRef} from 'react'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {api} from 'web/lib/api'
import {useLocale} from 'web/lib/locale'

const ChoicesContext = createContext<UseAllChoices | null>(null)

export const ChoicesProvider = ({children}: {children: ReactNode}) => {
  const choices = useAllChoices()
  return <ChoicesContext.Provider value={choices}>{children}</ChoicesContext.Provider>
}

export const useChoicesContext = () => {
  const ctx = useContext(ChoicesContext)
  if (!ctx) throw new Error('useChoicesContext must be used within a ChoicesProvider')
  return ctx
}

/**
 * The default view for one option table: the most-used options, most-used first.
 *
 * This used to be every row in the table, read straight from PostgREST and sorted alphabetically in
 * the browser. Two problems, and they compound. Alphabetical order carries no information about
 * which options anyone uses, so the reader gets a wall of chips beginning at whatever starts with
 * "A", stops reading, and types instead — and typing without matching is what mints duplicates. And
 * because the taxonomy is user-creatable, the payload only ever grows.
 */
export async function fetchChoices(
  label: OptionTableKey,
  locale: string,
  opts: {limit?: number; ids?: string[]} = {},
) {
  debug('Fetching choices for', label)
  const {options} = await api('search-options', {
    table: label,
    locale,
    limit: opts.limit ?? DEFAULT_OPTIONS_SHOWN,
    ids: opts.ids,
  })
  return options
}

export type ChoiceMap = Record<string, string>

/** Everything one picker knows about one table. */
export type ChoicesEntry = {
  /**
   * id -> localised label, for every option this session has resolved: the default page, every
   * search result, every hydrated id. Read by the callers that only ever need a name for an id
   * they already hold (filter summaries, profile tags).
   *
   * Deliberately NOT the thing a picker renders in order. Option ids are numeric strings, and a JS
   * object with numeric-string keys iterates in numeric order — so reading the default view out of
   * this map would silently re-sort the server's popularity ranking by id.
   */
  choices: ChoiceMap
  /** The default view, in the server's order: most-used first. Grows as "Show more" is pressed. */
  defaults: OptionSummary[]
  /** How many options the table holds, so a picker knows whether "Show more" has anything to show. */
  total: number
  loading: boolean
}

const EMPTY_ENTRY: ChoicesEntry = {choices: {}, defaults: [], total: 0, loading: true}

const useChoices = (label: OptionTableKey) => {
  const [entry, setEntry] = usePersistentInMemoryState<ChoicesEntry>(
    EMPTY_ENTRY,
    `${label}-choices`,
  )
  const {locale} = useLocale()

  // Everything the session has ever resolved a label for, so a chip that was on screen a moment ago
  // does not lose its name when the default page is refetched. Kept in a ref rather than in state:
  // it feeds the next merge, and on its own it should never trigger a render.
  const seen = useRef<Record<string, OptionSummary>>({})

  /**
   * Folds options into the label map, and optionally into the ordered default view.
   *
   * `defaults` is 'replace' for a fresh first page, 'append' for another page of it, and left alone
   * for search results — a search must not reorder the list the reader sees when they clear the box.
   */
  const merge = useCallback(
    (
      options: OptionSummary[],
      opts: {total?: number; defaults?: 'replace' | 'append'; loading?: boolean} = {},
    ) => {
      for (const option of options) seen.current[option.id] = option
      setEntry((prev) => ({
        choices: {...prev.choices, ...mapValues(keyBy(options, 'id'), (o) => o.name)},
        defaults:
          opts.defaults === 'replace'
            ? options
            : opts.defaults === 'append'
              ? uniqBy([...prev.defaults, ...options], 'id')
              : prev.defaults,
        total: opts.total ?? prev.total,
        loading: opts.loading ?? false,
      }))
    },
    [setEntry],
  )

  const refreshChoices = useCallback(
    async (ids?: string[]) => {
      try {
        const {options, total} = await api('search-options', {
          table: label,
          locale,
          limit: DEFAULT_OPTIONS_SHOWN,
          ids,
        })
        merge(options, {total, defaults: 'replace'})
      } catch (err: any) {
        console.error('Error fetching choices:', err?.message ?? err)
        setEntry((prev) => ({...prev, loading: false}))
      }
    },
    [label, locale, merge, setEntry],
  )

  /**
   * Ranked search, straight from the server — no client-side filtering behind it.
   *
   * The browser only holds the popular slice now, so filtering that slice locally would answer
   * "computer programming" with nothing at all while "Programming" sat one query away. Results are
   * merged into the label map on the way past so anything the reader ticks keeps its name.
   */
  const searchChoices = useCallback(
    async (q: string, limit = DEFAULT_OPTIONS_SHOWN) => {
      const {options} = await api('search-options', {table: label, locale, q, limit})
      merge(options)
      return options
    },
    [label, locale, merge],
  )

  /** Loads another page of the default view, for "Show more". */
  const loadMore = useCallback(
    async (offset: number, limit = DEFAULT_OPTIONS_SHOWN) => {
      const {options, total} = await api('search-options', {table: label, locale, limit, offset})
      merge(options, {total, defaults: 'append'})
      return options
    },
    [label, locale, merge],
  )

  /**
   * Resolves labels for ids the default page does not include — a rarely-held interest someone has
   * ticked, or a filter restored from a bookmarked search. Without this, dropping the full-table
   * fetch would have made those render as nothing at all.
   */
  const hydrate = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => !seen.current[id])
      if (!missing.length) return
      const {options} = await api('search-options', {
        table: label,
        locale,
        ids: missing,
        limit: missing.length,
      })
      merge(options)
    },
    [label, locale, merge],
  )

  useEffect(() => {
    refreshChoices()
  }, [refreshChoices])

  return {entry, refreshChoices, searchChoices, loadMore, hydrate}
}

export type ChoicesTable = ReturnType<typeof useChoices>

export type UseAllChoices = Record<OptionTableKey, ChoiceMap> & {
  tables: Record<OptionTableKey, ChoicesTable>
  refreshInterests: () => void
  refreshCauses: () => void
  refreshWork: () => void
}

const useAllChoices = (): UseAllChoices => {
  const interests = useChoices('interests')
  const causes = useChoices('causes')
  const work = useChoices('work')
  const tables = {interests, causes, work}

  return {
    // The bare `label -> {id: name}` maps stay on the context because plenty of read-only callers
    // (filter summaries, OG cards) only ever want a label for an id they already hold.
    ...(Object.fromEntries(
      OPTION_TABLES.map((label) => [label, tables[label].entry.choices]),
    ) as Record<OptionTableKey, ChoiceMap>),
    tables,
    refreshInterests: interests.refreshChoices,
    refreshCauses: causes.refreshChoices,
    refreshWork: work.refreshChoices,
  }
}

/**
 * Makes sure the label map can name every option id in `idsByTable`, fetching the ones it cannot.
 *
 * The default view is now the most-used options rather than all of them, so any code that turns an
 * id into a label for something the reader *already chose* has to say so. Saved searches are the
 * sharp case: a search bookmarked around a rare interest would otherwise describe itself with a gap
 * where the interest should be, and `formatFilters` renders whatever the map gives it.
 */
export const useEnsureChoiceLabels = (
  idsByTable: Partial<Record<OptionTableKey, string[] | undefined>>,
) => {
  const {tables} = useChoicesContext()
  // Depend on the ids themselves, not on the object identity a caller rebuilds every render.
  const signature = OPTION_TABLES.map((label) => (idsByTable[label] ?? []).join(',')).join('|')

  useEffect(() => {
    for (const label of OPTION_TABLES) {
      const ids = (idsByTable[label] ?? []).filter((id) => /^\d+$/.test(id))
      if (ids.length) tables[label].hydrate(ids)
    }
  }, [signature])
}
