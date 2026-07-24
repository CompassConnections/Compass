import clsx from 'clsx'
import {ComponentType, SVGProps, useMemo} from 'react'
import {Cell, Pie, PieChart, ResponsiveContainer} from 'recharts'
import {surface} from 'web/components/widgets/surface'
import {useThemeColors} from 'web/hooks/use-theme-colors'

/**
 * A donut for a small categorical or ordinal split (gender, age) — the counterpart to the bar-list
 * `DistributionCard`. It exists to break the page's rhythm: a run of identical bar lists reads as
 * wallpaper, so the two splits that are naturally few-valued get a different mark entirely.
 *
 * Identity is carried by the legend (label + count + %), not by colour alone — which is what lets the
 * slices stay on the brand's single warm ramp instead of pulling in loud categorical hues. Each segment
 * names its own colour token, so the colour follows the entity, never its rank.
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>

export type DonutSegment = {
  label: string
  value: number
  /** A Tailwind colour CSS variable name, e.g. `--color-primary-500`. */
  colorVar: string
}

export function StatDonut({
  title,
  subtitle,
  icon: Icon,
  segments,
}: {
  title: string
  subtitle: string
  icon: IconType
  segments: DonutSegment[]
}) {
  const data = segments.filter((s) => s.value > 0)
  const total = data.reduce((sum, s) => sum + s.value, 0)

  const varNames = useMemo(() => data.map((s) => s.colorVar), [data])
  const colors = useThemeColors(varNames)
  // The 2px gaps between slices are drawn in the surface colour so they read as clean cuts, not outlines.
  const [surfaceColor] = useThemeColors(SURFACE_VAR)

  if (!total) return null

  return (
    <div className={clsx(surface, 'flex h-full flex-col p-5 sm:p-6')}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 ring-1 ring-primary-200">
          <Icon className="h-[18px] w-[18px] text-primary-600" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight text-ink-900">{title}</h3>
          <p className="text-xs text-ink-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-[128px] w-[128px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={63}
                startAngle={90}
                endAngle={-270}
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke={surfaceColor ?? undefined}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i] ?? 'transparent'} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{background: colors[i] ?? 'transparent'}}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink-700" title={s.label}>
                {s.label}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-900">
                {Math.round((s.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SURFACE_VAR = ['--color-canvas-50']
