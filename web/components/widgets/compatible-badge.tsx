import {CheckBadgeIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {formatPercent} from 'common/util/format'
import {clamp} from 'lodash'
import {Row} from 'web/components/layout/row'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useT} from 'web/lib/locale'

/**
 * The likely range of a score, as whole percentages, or nothing for a row precomputed before the
 * range existed. Widened to include the point estimate: the stored score carries tie-breaking noise
 * the edges do not, and rounding can push it a hair past them.
 */
const getLikelyRange = (compatibility: CompatibilityScore) => {
  const {score, low, high} = compatibility
  if (low == null || high == null) return undefined
  const s = clamp(score ?? 0, 0, 1)
  return {
    low: Math.round(Math.min(clamp(low, 0, 1), s) * 100),
    high: Math.round(Math.max(clamp(high, 0, 1), s) * 100),
  }
}

/**
 * What the score is, and how firm it is. The number alone read as a fact; a pair with three shared
 * answers and a pair with eighty got the same "72%". The range says how much it could still move,
 * and the count says why.
 */
const useCompatibilityTooltip = (compatibility: CompatibilityScore) => {
  const t = useT()
  const range = getLikelyRange(compatibility)
  const base = t('compatibility.tooltip', 'Compatibility score between you two')
  if (!range || compatibility.sharedAnswers == null) return base
  return `${base}. ${t(
    'compatibility.tooltip_range',
    "Likely between {low}% and {high}%, based on {count} questions you've both answered. The range narrows as you both answer more.",
    {low: String(range.low), high: String(range.high), count: String(compatibility.sharedAnswers)},
  )}`
}

export const CompatibleBadge = (props: {compatibility: CompatibilityScore; className?: string}) => {
  const {compatibility, className} = props
  const tooltip = useCompatibilityTooltip(compatibility)
  return (
    <Tooltip text={tooltip}>
      <Row className={clsx('items-center gap-1 text-sm font-semibold', className)}>
        <CheckBadgeIcon className="h-4 w-4" />
        {formatPercent(compatibility.score ?? 0)}{' '}
      </Row>
    </Tooltip>
  )
}

/**
 * Same score as {@link CompatibleBadge}, given the room it deserves: a large figure over a filled
 * track, headed by a label.
 *
 * This is the most decision-relevant number on a profile, and as a badge it was a 12px pill wedged
 * between a search box and a dropdown. The bar carries the part the number alone does not — how far
 * along the range it sits — using the same track and fill as the Big Five rows.
 */
export const CompatibilityScoreBar = (props: {
  compatibility: CompatibilityScore
  /** Drop the caption where the surrounding heading already says "compatibility". */
  hideLabel?: boolean
  className?: string
}) => {
  const {compatibility, hideLabel, className} = props
  const t = useT()
  const score = clamp(compatibility.score ?? 0, 0, 1)
  const range = getLikelyRange(compatibility)
  const tooltip = useCompatibilityTooltip(compatibility)

  return (
    <Tooltip text={tooltip}>
      <div className={clsx('w-full', className)} data-testid="compatibility-score-bar">
        <Row className="items-baseline justify-between gap-3">
          {!hideLabel && (
            <span
              className="text-ink-400 font-dm-sans uppercase"
              style={{fontSize: '10px', letterSpacing: '0.18em'}}
            >
              {t('compatibility.label', 'Compatibility')}
            </span>
          )}
          <Row className="items-baseline gap-2">
            <span
              className="font-heading text-primary-900 tabular-nums"
              style={{fontSize: '26px', lineHeight: 1}}
            >
              {Math.round(score * 100)}%
            </span>
            {/* The range beside the figure, in muted ink so the headline stays the headline. */}
            {range && (
              <span
                className="text-ink-500 tabular-nums text-xs"
                data-testid="compatibility-score-range"
              >
                {range.low}–{range.high}%
              </span>
            )}
          </Row>
        </Row>
        {range ? (
          /* The conventional point-and-interval form: a thin axis, the likely range as a whisker
             with end caps, and a dot for the estimate. A bar filled from zero reads as a quantity
             accumulated, which is the wrong message for an estimate; the dot says "about here"
             and the whisker says how far it could move. A slightly thicker solid stroke runs from 0
             to the lower bound (the part the pair has almost surely earned); from there to the upper
             bound the range is one uniform band either side of the dot. */
          <div
            className="relative mt-2 h-4 w-full"
            data-testid="compatibility-score-interval"
            aria-hidden
          >
            <div className="bg-canvas-300 absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
            <div
              className="bg-primary-500/30 absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
              style={{left: `${range.low}%`, width: `${range.high - range.low}%`}}
            />
            <div
              className="bg-primary-500 absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full transition-[width] duration-500"
              style={{width: `${range.low}%`}}
            />
            {[range.low, range.high].map((edge, i) => (
              <div
                key={i}
                className="bg-primary-600 absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{left: `${edge}%`}}
              />
            ))}
            <div
              className="bg-primary-600 ring-canvas-50 absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-[left] duration-500"
              style={{left: `${score * 100}%`}}
            />
          </div>
        ) : (
          // Rows precomputed before the range existed have no interval to draw yet.
          <div className="bg-canvas-200 mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary-500 h-full rounded-full transition-[width] duration-500"
              style={{width: `${score * 100}%`}}
            />
          </div>
        )}
      </div>
    </Tooltip>
  )
}

/**
 * Same score as {@link CompatibleBadge}, drawn as a progress ring. Used on profile cards where the
 * number has to be readable at a glance without competing with the name for attention.
 */
export const CompatibilityRing = (props: {
  compatibility: CompatibilityScore
  sizePx?: number
  className?: string
}) => {
  const {compatibility, sizePx = 34, className} = props
  const tooltip = useCompatibilityTooltip(compatibility)

  const score = clamp(compatibility.score ?? 0, 0, 1)
  const range = getLikelyRange(compatibility)
  const strokeWidth = sizePx <= 30 ? 1.5 : 2
  const radius = (sizePx - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <Tooltip text={tooltip}>
      <div
        className={clsx('relative shrink-0', className)}
        style={{width: sizePx, height: sizePx}}
        data-testid="compatibility-ring"
      >
        <svg width={sizePx} height={sizePx} className="-rotate-90" aria-hidden>
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-canvas-300"
          />
          {/* Likely range as a faint arc under the solid one, from `low` round to `high`: the dash
              is the band's length and the negative offset walks its start round to `low`. */}
          {range && (
            <circle
              cx={sizePx / 2}
              cy={sizePx / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={`${((range.high - range.low) / 100) * circumference} ${circumference}`}
              strokeDashoffset={-(range.low / 100) * circumference}
              className="text-primary-300/40"
            />
          )}
          <circle
            cx={sizePx / 2}
            cy={sizePx / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score)}
            // eslint-disable-next-line no-restricted-syntax -- decorative ring stroke, not text
            className="text-primary-300 transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <span
          className={clsx(
            // No `dark:` override — the ink scale already flips with the theme.
            'absolute inset-0 grid place-items-center font-medium tabular-nums text-ink-600',
            sizePx <= 30 ? 'text-[10px]' : sizePx <= 36 ? 'text-[11px]' : 'text-xs',
          )}
        >
          {Math.round(score * 100)}
        </span>
      </div>
    </Tooltip>
  )
}
