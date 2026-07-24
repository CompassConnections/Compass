import clsx from 'clsx'
import {CountryCount} from 'common/stats'
import {geoPath, geoProjection} from 'd3-geo'
import type {Feature, FeatureCollection, Geometry, MultiPoint} from 'geojson'
import {useState} from 'react'
import {feature} from 'topojson-client'
import type {Topology} from 'topojson-specification'
import {surface} from 'web/components/widgets/surface'
import {useT} from 'web/lib/locale'
import worldTopo from 'world-atlas/countries-110m.json'

/**
 * Where members are, as a choropleth heatmap (the counterpart to the ranked-bar `CountrySpread`).
 *
 * A world map is the one form that shows *reach* at a glance — a bar list ranks the top few, but only a
 * map makes "not tied to one country" legible instantly. Fill is a single warm ramp (sequential, the
 * right encoding for a magnitude), so it stays on-brand rather than pulling in map-primary blues; the
 * top few countries are named directly on the map, and any country is hoverable for its exact count.
 *
 * Geometry (world-atlas 110m) and the projection are computed once at module load — the extent is fixed
 * to the viewBox, so nothing here is per-render. Antarctica is dropped: it's always empty and eats a
 * third of the vertical space.
 */

type CountryFeature = Feature<Geometry, {name: string}>

// Fixed internal coordinate system; the SVG scales to its container via viewBox.
//
// The projection is Miller cylindrical, built here from its raw formula because d3-geo ships Mercator and
// equirectangular but not Miller. Picking it is what makes the map fill its box without looking wrong:
//   • Pseudocylindrical (NaturalEarth, EqualEarth) curves the edges inward toward the poles, pushing
//     Alaska a long way from the left border and leaving the corners empty.
//   • Equirectangular has straight edges but a *constant* vertical scale, so high-latitude land — Alaska,
//     Russia, Greenland — comes out horizontally smeared.
//   • Mercator cures the smearing but balloons Greenland and Russia.
// Miller keeps straight vertical meridians, so every latitude spans the full width and Alaska sits against
// the left border with New Zealand against the right, while its vertical scale grows gently toward the
// poles so shapes stay natural. Latitudes are trimmed to the inhabited band, cropping empty polar water.
const LAT_TOP = 84
const LAT_BOTTOM = -57
const VIEW_W = 820
const MARGIN = 6
const DEG = Math.PI / 180

/** Miller's vertical coordinate for a latitude in degrees (its raw y, in projection units). */
function millerY(latDeg: number) {
  return 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latDeg * DEG))
}

function millerRaw(lambda: number, phi: number): [number, number] {
  return [lambda, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi))]
}
millerRaw.invert = function (x: number, y: number): [number, number] {
  return [x, 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI]
}

// Height follows the window's own aspect (full 360° of longitude against the trimmed latitude band), so
// the map fills the box with no letterboxing in either axis.
const VIEW_H = Math.round(
  ((VIEW_W - 2 * MARGIN) * (millerY(LAT_TOP) - millerY(LAT_BOTTOM))) / (2 * Math.PI) + 2 * MARGIN,
)

// The four corners of that window. Fitting to these (rather than to the country shapes) is what makes the
// map fill the box exactly: the shapes' own bounds are useless here because Fiji and Russia straddle the
// antimeridian and each report a full-width bounding box.
const WINDOW: MultiPoint = {
  type: 'MultiPoint',
  coordinates: [
    [-179.999, LAT_TOP],
    [179.999, LAT_TOP],
    [179.999, LAT_BOTTOM],
    [-179.999, LAT_BOTTOM],
  ],
}

// How many countries the ranked list under the map names before collapsing the rest into "+N more".
const TOP_LIST = 16

const topology = worldTopo as unknown as Topology
const collection = feature(topology, topology.objects.countries) as FeatureCollection<
  Geometry,
  {name: string}
>

const FEATURES: CountryFeature[] = collection.features.filter(
  (f) => f.properties.name !== 'Antarctica',
)

const projection = geoProjection(millerRaw).fitExtent(
  [
    [MARGIN, MARGIN],
    [VIEW_W - MARGIN, VIEW_H - MARGIN],
  ],
  WINDOW,
)
const pathGen = geoPath(projection)

const SHAPES = FEATURES.map((f) => ({
  name: f.properties.name,
  d: pathGen(f) ?? '',
  centroid: pathGen.centroid(f) as [number, number],
}))

// The stored `profiles.country` is an English display name; world-atlas uses its own short forms for a
// handful of countries. Map our name → the atlas name for the common mismatches. Everything else matches
// directly. Keys and the atlas lookup are both diacritic-stripped + lowercased, so accents never matter.
const NAME_ALIASES: Record<string, string> = {
  'united states': 'united states of america',
  usa: 'united states of america',
  us: 'united states of america',
  'czech republic': 'czechia',
  'democratic republic of the congo': 'dem. rep. congo',
  'republic of the congo': 'congo',
  'bosnia and herzegovina': 'bosnia and herz.',
  'dominican republic': 'dominican rep.',
  'central african republic': 'central african rep.',
  'south sudan': 's. sudan',
  'equatorial guinea': 'eq. guinea',
  'solomon islands': 'solomon is.',
  'ivory coast': "cote d'ivoire",
  eswatini: 'eswatini',
  'north macedonia': 'macedonia',
}

function normalize(name: string) {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

const SHAPE_BY_NORM = new Map(SHAPES.map((s) => [normalize(s.name), s.name]))

// Colour for a country with no members — a neutral land tone, deliberately outside the amber ramp so
// that even a single member (the lightest ramp step) reads as clearly "someone is here" against it.
const EMPTY_VAR = '--color-canvas-300'

// Sequential amber ramp, light → dark. It starts at a *saturated* step (primary-300), not a near-white
// one, precisely so 1 member is visibly amber against the empty-land tone — the difference between nobody
// and one person has to show. Referenced as CSS vars so the fills track the theme toggle without any JS.
const RAMP = [
  '--color-primary-300',
  '--color-primary-400',
  '--color-primary-500',
  '--color-primary-600',
  '--color-primary-700',
]

function rampVar(count: number, max: number): string {
  if (count <= 0) return EMPTY_VAR
  // sqrt so a long tail of 1-member countries doesn't all collapse onto the lightest step.
  const t = Math.sqrt(count / max)
  const i = Math.min(RAMP.length - 1, Math.max(0, Math.ceil(t * RAMP.length) - 1))
  return RAMP[i]
}

export function WorldHeatmap({
  countries,
  countryCount,
}: {
  countries?: CountryCount[]
  countryCount?: number
}) {
  const t = useT()
  const [hover, setHover] = useState<{name: string; count: number; x: number; y: number} | null>(
    null,
  )

  const rows = countries ?? []
  // Resolve each data row to an atlas shape name, then sum onto it (two data spellings could collide).
  const countByShape = new Map<string, number>()
  for (const row of rows) {
    const norm = normalize(row.country)
    const shapeName = SHAPE_BY_NORM.get(NAME_ALIASES[norm] ?? norm)
    if (!shapeName) continue
    countByShape.set(shapeName, (countByShape.get(shapeName) ?? 0) + row.count)
  }

  const max = Math.max(1, ...Array.from(countByShape.values()))
  const total = countryCount ?? rows.length

  // The ranked list under the map — the country names and counts live here now, not on the map itself.
  const ranked = [...rows].sort((a, b) => b.count - a.count)
  const shownList = ranked.slice(0, TOP_LIST)
  const remaining = ranked.length - shownList.length

  return (
    <div className={clsx(surface, 'flex h-full flex-col p-5 sm:p-6')}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold leading-tight text-ink-900">
            {t('stats.countries.title', 'Where members are')}
          </h3>
          <p className="text-xs text-ink-500">
            {total > 1
              ? t('stats.countries.reach', '{count} countries and counting', {count: total})
              : t('stats.countries.subtitle', 'Compass is not tied to one city or one country.')}
          </p>
        </div>
        {/* Compact sequential legend: light = few, dark = many. */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
            Fewer
          </span>
          <div className="flex overflow-hidden rounded-full ring-1 ring-canvas-200">
            {RAMP.map((v) => (
              <span key={v} className="h-2.5 w-4" style={{background: `rgb(var(${v}))`}} />
            ))}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-500">More</span>
        </div>
      </div>

      {/* Bled out to the card's edges (cancelling its horizontal padding) so the map really does span the
          full width. The overlay tooltip is positioned inside this same box, so it scales with the map. */}
      <div className="relative -mx-5 mt-2 w-auto sm:-mx-6">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-auto w-full"
          role="img"
          aria-label={t('stats.countries.title', 'Where members are')}
        >
          {SHAPES.map((s) => {
            const count = countByShape.get(s.name) ?? 0
            return (
              <path
                key={s.name}
                d={s.d}
                style={{fill: `rgb(var(${rampVar(count, max)}))`}}
                stroke="rgb(var(--color-canvas-50))"
                strokeWidth={0.5}
                className={clsx(count > 0 && 'cursor-default')}
                onMouseEnter={
                  count > 0
                    ? () =>
                        setHover({
                          name: s.name,
                          count,
                          x: (s.centroid[0] / VIEW_W) * 100,
                          y: (s.centroid[1] / VIEW_H) * 100,
                        })
                    : undefined
                }
                onMouseLeave={count > 0 ? () => setHover(null) : undefined}
              />
            )
          })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-canvas-950 px-2.5 py-1.5 text-center shadow-lg"
            style={{left: `${hover.x}%`, top: `${hover.y}%`}}
          >
            <div className="text-xs font-bold leading-tight text-white">{hover.name}</div>
            <div className="text-[11px] font-semibold tabular-nums text-primary-400">
              {hover.count === 1
                ? t('stats.countries.member_one', '1 member')
                : t('stats.countries.members', '{count} members', {count: hover.count})}
            </div>
          </div>
        )}
      </div>

      {/* Country names + counts, below the map. Each swatch matches that country's fill on the map, so
          the list and the map read as one object; the tail collapses into a "+N more". */}
      {!!shownList.length && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-canvas-200/70 pt-4">
          {shownList.map((r) => {
            const norm = normalize(r.country)
            const resolved = SHAPE_BY_NORM.get(NAME_ALIASES[norm] ?? norm)
            const fillVar = resolved ? rampVar(r.count, max) : EMPTY_VAR
            return (
              <span key={r.country} className="inline-flex items-center gap-1.5 text-[13px]">
                <span
                  className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-inset ring-black/5"
                  style={{background: `rgb(var(${fillVar}))`}}
                />
                <span className="text-ink-700">{r.country}</span>
                <span className="font-bold tabular-nums text-ink-900">
                  {r.count.toLocaleString()}
                </span>
              </span>
            )
          })}
          {remaining > 0 && (
            <span className="text-[13px] text-ink-500">
              {t('stats.countries.remaining', '+ {count} more countries', {count: remaining})}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
