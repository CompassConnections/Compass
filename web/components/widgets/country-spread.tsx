import {CountryCount} from 'common/stats'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'

/**
 * Where members are, as a ranked bar list (A5 in docs/marketing-visuals.md).
 *
 * Lives in `widgets/` rather than `components/about/` because it is used from `/stats`, which is where
 * it ended up: it is a distribution readout for someone who came to read numbers, and the about page
 * only needed one claim about reach, which the member count already carries.
 *
 * Takes its data as props when the caller already has it — `/stats` fetches the whole `stats` payload
 * for the page — and falls back to fetching for standalone use. Passing `undefined` props to
 * `useAPIGetter` makes it skip the request rather than firing a duplicate.
 *
 * Renders **nothing** below a handful of countries, and nothing at all when the data is missing: an
 * empty frame claims more than it shows.
 */

/**
 * Below this there is not enough of a spread to be worth drawing bars for. Exported because a caller
 * that puts this in a column of its own has to know whether the column will be empty *before* laying
 * it out — a hidden child still leaves the grid track behind.
 */
export const MIN_COUNTRIES = 3

function CountryBar({row, max}: {row: CountryCount; max: number}) {
  // Widths are relative to the largest country, not to the total. Against the total the long tail
  // collapses into slivers of identical apparent length and the ranking stops being readable.
  const pct = Math.max(2, Math.round((row.count / max) * 100))
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm text-ink-600 truncate" title={row.country}>
        {row.country}
      </div>
      <div className="flex-1 h-2 rounded-full bg-canvas-200 overflow-hidden">
        <div className="h-full rounded-full bg-primary-500" style={{width: `${pct}%`}} />
      </div>
      <div className="w-10 shrink-0 text-right text-sm text-ink-500 tabular-nums">{row.count}</div>
    </div>
  )
}

export function CountrySpread(props: {countries?: CountryCount[]; countryCount?: number}) {
  const t = useT()
  // Skips the request entirely when the caller supplied the data — `useAPIGetter` bails on undefined
  // props — so /stats, which already fetches the whole payload, does not fetch it twice.
  const {data} = useAPIGetter('stats', props.countries ? undefined : {})

  const countries = props.countries ?? data?.countries ?? []
  const total = props.countryCount ?? data?.countryCount ?? 0
  if (countries.length < MIN_COUNTRIES) return null

  const max = countries[0].count
  const remaining = total - countries.length

  return (
    <div>
      <h3 className="text-sm font-bold text-ink-900 mb-1">
        {t('stats.countries.title', 'Where members are')}
      </h3>
      <p className="text-sm text-ink-500 leading-relaxed mb-4">
        {t('stats.countries.subtitle', 'Compass is not tied to one city or one country.')}
      </p>
      <div className="flex flex-col gap-2.5">
        {countries.map((row) => (
          <CountryBar key={row.country} row={row} max={max} />
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-ink-500 mt-3">
          {t('stats.countries.remaining', '+ {count} more countries', {count: remaining})}
        </p>
      )}
    </div>
  )
}
