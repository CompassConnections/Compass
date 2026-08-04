import {CheckBadgeIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {formatPercent} from 'common/util/format'
import {clamp} from 'lodash'
import {Row} from 'web/components/layout/row'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useT} from 'web/lib/locale'

export const CompatibleBadge = (props: {compatibility: CompatibilityScore; className?: string}) => {
  const {compatibility, className} = props
  const t = useT()
  return (
    <Tooltip text={t('compatibility.tooltip', 'Compatibility score between you two')}>
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

  return (
    <Tooltip text={t('compatibility.tooltip', 'Compatibility score between you two')}>
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
          <span
            className="font-heading text-primary-900 tabular-nums"
            style={{fontSize: '26px', lineHeight: 1}}
          >
            {Math.round(score * 100)}%
          </span>
        </Row>
        <div className="bg-canvas-200 mt-2 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary-500 h-full rounded-full transition-[width] duration-500"
            style={{width: `${score * 100}%`}}
          />
        </div>
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
  const t = useT()

  const score = clamp(compatibility.score ?? 0, 0, 1)
  const strokeWidth = sizePx <= 30 ? 1.5 : 2
  const radius = (sizePx - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <Tooltip text={t('compatibility.tooltip', 'Compatibility score between you two')}>
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
