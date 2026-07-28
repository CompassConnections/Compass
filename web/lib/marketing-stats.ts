import {DemographicField, Stats} from 'common/stats'

/**
 * Turns the raw `stats` payload into the handful of claims the home and about pages make about who is on
 * Compass.
 *
 * Both pages describe the same population and must never disagree about it, so the arithmetic lives here
 * once rather than inline in two page components. Nothing is hardcoded, for the same reason `StatBand` and
 * `MemberGrowth` are not: a membership figure that quietly goes stale on a page arguing for transparency is
 * the failure worth engineering against. Every function returns `undefined` rather than a zero when the
 * data is missing, so a caller can render nothing at all — an empty frame claims more than it shows.
 *
 * ## Percentages only for single-select fields
 *
 * This is the load-bearing rule. `base` on a multi-select distribution counts *distinct answerers*, but the
 * per-value counts can overlap — one member who selects both "atheist" and "agnostic" is one in the base
 * and two in the sum. Adding those counts and dividing by the base therefore overstates, by an amount that
 * is not knowable from this payload.
 *
 * So: `shareOf` refuses to compute for a multi-select field, and multi-select claims are made with `topOf`,
 * which reports each value's own count against the base and lets the reader add them up. Both pages promise
 * that nothing on them is a claim you can't check; a percentage that could be silently inflated is exactly
 * the kind of claim that promise rules out.
 */

export type Share = {
  /** Whole percent of the members who answered this field. */
  pct: number
  /** How many answered — the denominator, which both pages print next to the figure. */
  base: number
}

export type TopValue = {
  /** Raw stored value (`'atheist'`, `'bachelors'`), for labelling by the caller. */
  value: string
  count: number
  base: number
}

/**
 * Share of respondents whose answer is one of `values`. Single-select fields only — see the note above on
 * why the multi-select case is deliberately not supported rather than approximated.
 */
export function shareOf(
  stats: Stats | undefined,
  field: DemographicField,
  values: string[],
): Share | undefined {
  const dist = stats?.demographics?.[field]
  if (!dist?.base || dist.multi) return undefined
  const count = dist.items.reduce((n, i) => (values.includes(i.value) ? n + i.count : n), 0)
  if (!count) return undefined
  return {pct: Math.round((count / dist.base) * 100), base: dist.base}
}

/**
 * The `n` most common answers to a field, in the order the backend already ranked them. Safe for
 * multi-select fields because each count stands on its own instead of being summed.
 */
export function topOf(
  stats: Stats | undefined,
  field: DemographicField,
  n: number,
): TopValue[] | undefined {
  const dist = stats?.demographics?.[field]
  if (!dist?.base || !dist.items.length) return undefined
  return dist.items.slice(0, n).map((i) => ({value: i.value, count: i.count, base: dist.base}))
}

/** How many members answered a field at all. */
export function baseOf(stats: Stats | undefined, field: DemographicField): number | undefined {
  return stats?.demographics?.[field]?.base || undefined
}

/** The age buckets that make up "between 25 and 44". The backend emits these labels verbatim. */
export const CORE_AGE_BUCKETS = ['25–34', '35–44']
