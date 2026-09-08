import {APIErrors} from 'common/api/utils'
import {OPTION_TABLES, OptionTableKey} from 'common/profiles/constants'
import {OptionNameProblem} from 'common/profiles/option-name'
import {mapValues, uniq} from 'lodash'

export function validateTable(table: 'interests' | 'causes' | 'work') {
  if (!OPTION_TABLES.includes(table)) throw APIErrors.badRequest('Invalid table')
}

/**
 * How many options a picker shows before the reader has typed anything.
 *
 * The list used to be *every* option, sorted alphabetically — which is a wall of chips carrying no
 * information about which of them anyone actually uses, starting at whatever begins with "A". Nobody
 * reads to the end of it, so people type instead, and typing without matching is what mints
 * duplicates. Roughly two rows of chips is enough to read as "the common ones" and short enough to
 * actually scan.
 */
export const DEFAULT_OPTIONS_SHOWN = 24

/** Extra options each "Show more" press reveals. Deliberately not "all of them". */
export const OPTIONS_PAGE_SIZE = 24

/** A `similarity()` at or above this makes an existing option worth offering before creating a new one. */
export const OPTION_SIMILARITY_THRESHOLD = 0.42

export type OptionSummary = {
  /** Stringified `interests.id` — the option tables use BIGINT, and profile fields carry ids as strings. */
  id: string
  /** Already localised: the `*_translations` name for the requested locale, else the base name. */
  name: string
  /** Profiles currently holding this option. Drives ordering, and the "used by N people" hint. */
  usageCount: number
}

/**
 * What the server makes of a name someone typed into "Search or add", before anything is written.
 *
 * The point of returning a verdict rather than just creating the option is the `suggestion` case:
 * that is where "Computer programming" gets to become "Programming" instead of the 2,001st interest.
 */
export type OptionNameVerdict =
  /** Not fit to be an option at all — too long, two options in one string, no letters in it. */
  | {status: 'invalid'; problem: OptionNameProblem; parts?: string[]}
  /** Already exists. `alias` means it only exists under a name that was merged away earlier. */
  | {status: 'existing'; option: OptionSummary; matchedOn: 'name' | 'alias'}
  /** Nothing matches exactly, but these do closely enough to be worth offering first. */
  | {status: 'suggestion'; name: string; candidates: OptionSummary[]; reason: 'similar' | 'llm'}
  /** Genuinely new. `name` is the canonical spelling it would be created under. */
  | {status: 'new'; name: string}

/**
 * The option ids referenced across a set of saved filter objects, grouped by table.
 *
 * Feeds `useEnsureChoiceLabels`: a saved search names its options by id, and the browser no longer
 * holds every option, so the ids have to be gathered before the labels can be looked up.
 */
export function collectOptionIds(filterSets: unknown[]): Record<OptionTableKey, string[]> {
  const byTable = {interests: [], causes: [], work: []} as Record<OptionTableKey, string[]>
  for (const filters of filterSets) {
    // Saved filters come out of the database as `Json`, so the shape is checked rather than assumed.
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) continue
    for (const table of OPTION_TABLES) {
      const value = (filters as Record<string, unknown>)[table]
      if (Array.isArray(value)) byTable[table].push(...value.map(String))
    }
  }
  return mapValues(byTable, uniq)
}
