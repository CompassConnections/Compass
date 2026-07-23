import {ArrowTrendingUpIcon} from '@heroicons/react/24/outline'
import {useEffect, useRef, useState} from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {useT} from 'web/lib/locale'
import {getCompletedProfilesCreations, getProfilesCreations} from 'web/lib/supabase/users'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCounts(rows: any[]) {
  const counts: Record<string, number> = {}
  for (const r of rows) {
    const date = new Date(r.created_time).toISOString().split('T')[0]
    counts[date] = (counts[date] || 0) + 1
  }
  return counts
}

function cumulativeFromCounts(counts: Record<string, number>, sortedDates: string[]) {
  const out: Record<string, number> = {}
  let prev = 0
  for (const d of sortedDates) {
    prev += counts[d] || 0
    out[d] = prev
  }
  return out
}

function toISODate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .split('T')[0]
}

function addDays(d: Date, days: number) {
  const nd = new Date(d)
  nd.setUTCDate(nd.getUTCDate() + days)
  return nd
}

function buildDailyRange(startStr: string, endStr: string) {
  const out: string[] = []
  const start = new Date(startStr + 'T00:00:00.000Z')
  const end = new Date(endStr + 'T00:00:00.000Z')
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(toISODate(d))
  return out
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  })
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({active, payload, label}: any) {
  if (!active || !payload?.length) return null

  const date = payload[0]?.payload?.date
    ? new Date(payload[0].payload.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : formatDate(label)

  return (
    <div
      style={{
        background: 'rgb(247 244 239)', // canvas-50
        border: '1.5px solid rgb(232 213 188)', // canvas-200
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(44,36,22,0.12)',
      }}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgb(140 128 112)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}
      >
        {date}
      </p>
      {payload.map((entry: any) => (
        <div
          key={entry.dataKey}
          style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{fontSize: '12px', color: 'rgb(140 128 112)', fontWeight: 500}}>
            {entry.name}
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'rgb(30 26 20)',
              marginLeft: 'auto',
              paddingLeft: '12px',
            }}
          >
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Custom Legend ────────────────────────────────────────────────────────────

function CustomLegend({payload}: any) {
  return (
    <div style={{display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '8px'}}>
      {payload?.map((entry: any) => (
        <div key={entry.value} style={{display: 'flex', alignItems: 'center', gap: '7px'}}>
          <div
            style={{
              width: '24px',
              height: '3px',
              background: entry.color,
              borderRadius: '2px',
              ...(entry.payload?.strokeDasharray
                ? {
                    backgroundImage: `repeating-linear-gradient(90deg, ${entry.color} 0, ${entry.color} 4px, transparent 4px, transparent 7px)`,
                    background: 'none',
                  }
                : {}),
            }}
          />
          <span style={{fontSize: '12px', fontWeight: 600, color: 'rgb(140 128 112)'}}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Chart ────────────────────────────────────────────────────────────────────

/**
 * A stripped-down version of the growth curve for the about page (A3 in docs/marketing-visuals.md).
 *
 * Lives here rather than under components/about/ so it shares this file's date helpers — the shape of
 * the data is the same, only the presentation differs.
 *
 * Deliberately not the chart above. That one is an instrument: two series, axes, grid, tooltip, for
 * someone who came to /stats to read numbers. This one is a single claim on a page someone is
 * skimming, so it is one line, no axes, no tooltip, with the endpoints labelled in real HTML instead
 * of recharts ticks — which also sidesteps the hardcoded light-theme tick colours above.
 *
 * The number is queried live, never hardcoded. A count that quietly goes stale on a page arguing for
 * transparency is the one failure mode worth engineering against, and it is also why this renders
 * nothing at all rather than a placeholder when the query comes back empty.
 *
 * Scaling caveat, inherited from `getProfilesCreations`: this pulls one row per profile and rolls the
 * cumulative curve up in the browser. Fine at the current size, and identical to what /stats already
 * does, but it grows linearly — past a few thousand members this wants an aggregate endpoint
 * returning daily totals instead.
 */
// How long the line takes to draw itself in on reveal. Reused as the delay before the endpoint dot
// fades in, so the dot lands exactly when the line reaches it rather than floating ahead of it.
const GROWTH_DRAW_MS = 1400

export function MemberGrowth() {
  const t = useT()
  const [data, setData] = useState<{dateTs: number; members: number}[]>([])
  const [failed, setFailed] = useState(false)
  // 'hidden' → <Area> not mounted; 'drawing' → recharts animates it in; 'done' → static, endpoint dot
  // shown. Driven by an IntersectionObserver so the curve grows when the reader scrolls to it.
  const [phase, setPhase] = useState<'hidden' | 'drawing' | 'done'>('hidden')
  const figureRef = useRef<HTMLElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const profiles = await getProfilesCreations()
        if (!profiles?.length) return setFailed(true)

        const counts = buildCounts(profiles)
        const dates = Object.keys(counts).sort((a, b) => a.localeCompare(b))
        const range = buildDailyRange(dates[0], dates[dates.length - 1])
        const cumulative = cumulativeFromCounts(counts, range)

        setData(
          range.map((date) => ({
            dateTs: new Date(date + 'T00:00:00.000Z').getTime(),
            members: cumulative[date] || 0,
          })),
        )
      } catch {
        setFailed(true)
      }
    }
    void load()
  }, [])

  // Draw the curve on reveal, not on data load — a line "growing" only reads as growth if the reader
  // watches it happen. Re-armed when the data arrives (the figure, and so the ref, only mounts then).
  // Reduced-motion visitors skip the draw and get the final curve immediately.
  useEffect(() => {
    const el = figureRef.current
    if (!el || phase !== 'hidden') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done')
      return
    }
    // Hold off until the whole figure frame — plot plus its margin — has scrolled into view, not the
    // instant its top edge appears: the reader is still on the copy above it, and a curve that grows
    // off-screen isn't watched. threshold: 1 fires only once the entire element is within the viewport.
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.intersectionRatio >= 1)) {
          obs.disconnect()
          setPhase('drawing')
          window.setTimeout(() => setPhase('done'), GROWTH_DRAW_MS)
        }
      },
      {threshold: 1},
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [data.length, phase])

  // Render nothing rather than a zero or a spinner: this is supporting evidence on a page that reads
  // fine without it, and an empty chart frame claims more than it shows.
  if (failed || !data.length) return null

  const total = data[data.length - 1].members
  const monthYear = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})

  // Trailing-30-day growth, shown as a momentum badge beside the total. Read from the real series (never
  // hardcoded), and rendered only when positive — a flat or empty period simply omits it rather than
  // showing "+0", the same "say nothing rather than something weak" rule the rest of the page follows.
  const lastIndex = data.length - 1
  const recent = total - data[Math.max(0, lastIndex - 30)].members

  return (
    <figure
      ref={figureRef}
      className="bg-canvas-50 border-[1.5px] border-canvas-200 rounded-2xl p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-[-20px] sm:mb-[-40px]">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-ink-1000">{total.toLocaleString()}</span>
          <span className="text-sm text-ink-600">
            {t('about.growth.label', 'members and counting')}
          </span>
        </div>
        {recent > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
            <ArrowTrendingUpIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
            {t('about.growth.recent', '+{count} this month', {count: recent})}
          </span>
        )}
      </div>

      <div className="h-[120px] sm:h-[140px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{top: 8, right: 8, bottom: 0, left: 4}}>
            <defs>
              <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgb(193 127 62)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="rgb(193 127 62)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Mounted only once in view, so recharts draws it in from the left on reveal. Held out
                entirely while 'hidden' rather than rendered invisibly — that keeps the animation from
                firing off-screen before the reader ever sees it. */}
            {phase !== 'hidden' && (
              <Area
                type="monotone"
                dataKey="members"
                stroke="rgb(193 127 62)"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="url(#gradGrowth)"
                isAnimationActive={phase === 'drawing'}
                animationDuration={GROWTH_DRAW_MS}
                animationEasing="ease-out"
                activeDot={false}
                // A marker on the last point only: the current value, haloed so the line reads as "still
                // climbing, you are here". Amber-on-amber, so it needs no theme-dependent ring colour.
                // Faded in only once the draw completes ('done'), so it never sits ahead of the line.
                dot={(props: any) => {
                  const {cx, cy, index} = props
                  if (index !== lastIndex || cx == null || cy == null)
                    return <g key={`d-${index}`} />
                  return (
                    <g
                      key="end"
                      style={{
                        opacity: phase === 'done' ? 1 : 0,
                        transition: 'opacity 300ms ease-out',
                      }}
                    >
                      <circle cx={cx} cy={cy} r={8} fill="rgb(193 127 62)" opacity={0.16} />
                      <circle cx={cx} cy={cy} r={3.5} fill="rgb(193 127 62)" />
                    </g>
                  )
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Endpoints as text rather than an axis: two labels are all this needs, and they inherit the
          theme tokens instead of recharts' hardcoded tick colours. */}
      <figcaption className="flex justify-between text-xs text-ink-500 mt-1">
        <span>{monthYear(data[0].dateTs)}</span>
        <span>{t('about.growth.today', 'Today')}</span>
      </figcaption>
    </figure>
  )
}

export default function ChartMembers() {
  const [data, setData] = useState<any[]>([])
  const [chartHeight, setChartHeight] = useState(380)
  const [loading, setLoading] = useState(true)
  const t = useT()

  useEffect(() => {
    function applyHeight() {
      setChartHeight(window.innerWidth < 420 ? 280 : 380)
    }
    applyHeight()
    window.addEventListener('resize', applyHeight)
    return () => window.removeEventListener('resize', applyHeight)
  }, [])

  useEffect(() => {
    async function load() {
      const [allProfiles, completedProfiles] = await Promise.all([
        getProfilesCreations(),
        getCompletedProfilesCreations(),
      ])

      const countsAll = buildCounts(allProfiles)
      const countsCompleted = buildCounts(completedProfiles)

      const allDates = Object.keys(countsAll)
      const completedDates = Object.keys(countsCompleted)
      const sorted = [...allDates, ...completedDates].sort((a, b) => a.localeCompare(b))
      const minDateStr = sorted[0]
      const maxDateStr = sorted[sorted.length - 1]

      const dates = buildDailyRange(minDateStr, maxDateStr)
      const cumAll = cumulativeFromCounts(countsAll, dates)
      const cumCompleted = cumulativeFromCounts(countsCompleted, dates)

      setData(
        dates.map((date) => ({
          date,
          dateTs: new Date(date + 'T00:00:00.000Z').getTime(),
          profilesCreations: cumAll[date] || 0,
          profilesCompletedCreations: cumCompleted[date] || 0,
        })),
      )
      setLoading(false)
    }
    void load()
  }, [])

  // Colors from palette
  const AMBER = 'rgb(193 127 62)' // primary-500
  const SAGE = 'rgb(107 143 113)' // green-500

  return (
    <div>
      {/* Loading shimmer */}
      {loading && (
        <div
          style={{
            height: `${chartHeight}px`,
            background: 'rgb(247 244 239)',
            borderRadius: '16px',
            border: '1.5px solid rgb(232 213 188)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="animate-pulse"
        >
          <span style={{fontSize: '13px', color: 'rgb(140 128 112)', fontWeight: 500}}>
            Loading chart…
          </span>
        </div>
      )}

      {!loading && (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={data} margin={{top: 16, right: 16, bottom: 8, left: -8}}>
            {/* Gradient fills */}
            <defs>
              <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AMBER} stopOpacity={0.18} />
                <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SAGE} stopOpacity={0.14} />
                <stop offset="95%" stopColor={SAGE} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />

            <XAxis
              dataKey="dateTs"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDate}
              tick={{fontSize: 11, fill: 'rgb(140 128 112)', fontWeight: 500}}
              axisLine={{stroke: 'rgb(222 203 178)'}} // canvas-300
              tickLine={{stroke: 'rgb(222 203 178)'}}
              tickCount={6}
            />

            <YAxis
              tick={{fontSize: 11, fill: 'rgb(140 128 112)', fontWeight: 500}}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v)}
              width={40}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{stroke: 'rgb(193 127 62)', strokeWidth: 1, strokeDasharray: '4 2'}}
            />

            <Legend content={<CustomLegend />} />

            {/* Completed (sage, behind) */}
            <Area
              type="monotone"
              dataKey="profilesCompletedCreations"
              name={t('stats.with_bio', 'Completed')}
              stroke={SAGE}
              strokeWidth={2}
              strokeDasharray="5 3"
              fill="url(#gradSage)"
              dot={false}
              activeDot={{r: 4, fill: SAGE, stroke: 'rgb(247 244 239)', strokeWidth: 2}}
            />

            {/* Total (amber, on top) */}
            <Area
              type="monotone"
              dataKey="profilesCreations"
              name={t('stats.total', 'Total')}
              stroke={AMBER}
              strokeWidth={2.5}
              fill="url(#gradAmber)"
              dot={false}
              activeDot={{r: 5, fill: AMBER, stroke: 'rgb(247 244 239)', strokeWidth: 2}}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
