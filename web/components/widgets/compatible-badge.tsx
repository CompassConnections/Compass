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
  const strokeWidth = sizePx <= 30 ? 2.5 : 3
  const radius = (sizePx - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const toneClass =
    score >= 0.75 ? 'text-primary-500' : score >= 0.5 ? 'text-primary-400' : 'text-ink-400'

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
            className={clsx(toneClass, 'transition-[stroke-dashoffset] duration-500')}
          />
        </svg>
        <span
          className={clsx(
            // No `dark:` override — the ink scale already flips with the theme.
            'absolute inset-0 grid place-items-center font-semibold tabular-nums text-ink-800',
            sizePx <= 30 ? 'text-[10px]' : sizePx <= 36 ? 'text-[11px]' : 'text-xs',
          )}
        >
          {Math.round(score * 100)}
        </span>
      </div>
    </Tooltip>
  )
}
