import clsx from 'clsx'
import {ReactNode} from 'react'
import {eyebrow} from 'web/components/widgets/surface'

/**
 * Segmented progress for the multi-step flows (`/onboarding`, `/signup`).
 *
 * Both flows previously showed no progress at all: three onboarding screens and a two-step signup
 * that each looked exactly like the last, so the only way to know how much was left was to keep
 * clicking. That is the single biggest reason a signup flow gets abandoned midway, and it costs one
 * component to fix.
 *
 * Segments rather than a continuous bar because the step count is small and known — discrete marks
 * answer "how many more" directly, where a 66%-filled bar only implies it.
 *
 * `bg-cta` for the filled segments rather than `primary-500`: this is a small, purely decorative mark
 * against `canvas-200`, and using the CTA token keeps every "this is the active/committed thing"
 * signal on one colour across the flow.
 */
export function StepProgress({
  current,
  total,
  label,
  className,
}: {
  /** 1-based. */
  current: number
  total: number
  /** Already-translated, e.g. t('common.step_progress', 'Step {current} of {total}', {...}). */
  label?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('w-full', className)}>
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        // The visible label is decorative text; the bar needs its own accessible name because a
        // progressbar's contents are not announced.
        aria-valuetext={typeof label === 'string' ? label : `${current} / ${total}`}
      >
        {Array.from({length: total}, (_, i) => (
          <div
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full transition-colors duration-300 ease-out',
              i < current ? 'bg-cta' : 'bg-canvas-200',
            )}
          />
        ))}
      </div>
      {label && <p className={clsx(eyebrow, 'text-ink-700 mt-3')}>{label}</p>}
    </div>
  )
}
