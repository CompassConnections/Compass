import {
  ArrowUturnLeftIcon,
  CheckIcon,
  EyeSlashIcon,
  StarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {
  ModTestimonial,
  TESTIMONIAL_STATUS_LABELS,
  TestimonialStatus,
} from 'common/testimonials/testimonials'
import {ReactNode} from 'react'
import {useT} from 'web/lib/locale'

import {Row} from '../layout/row'

/** Any subset of the moderator-settable fields. Omitted keys are left alone by the endpoint. */
export type TestimonialPatch = {
  status?: TestimonialStatus
  featuredRank?: number | null
  moderatorNote?: string | null
}

const STATUS_PILL: Record<TestimonialStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
  rejected: 'bg-canvas-100 text-ink-500',
  hidden: 'bg-canvas-100 text-ink-500',
}

export function TestimonialStatusPill({status}: {status: TestimonialStatus}) {
  return (
    <span
      className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_PILL[status])}
    >
      {TESTIMONIAL_STATUS_LABELS[status]}
    </span>
  )
}

function ModAction({
  onClick,
  disabled,
  tone = 'neutral',
  icon,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  tone?: 'go' | 'stop' | 'neutral'
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'go' && 'bg-teal-600 text-white hover:bg-teal-700',
        tone === 'stop' && 'text-ink-600 hover:bg-canvas-100 ring-canvas-300 ring-1',
        tone === 'neutral' && 'text-ink-600 hover:bg-canvas-100 ring-canvas-300 ring-1',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/**
 * The approve/reject bar a moderator sees under a testimonial.
 *
 * Rendered inside the real card on `/testimonials` as well as in the admin queue, so the decision is
 * made while looking at exactly what the public would see — a table row with the first eighty
 * characters of the body is not enough to judge one on.
 *
 * Which actions exist depends on the current state, because "approve" on something already published
 * is a no-op that still looks like it did something.
 */
export function TestimonialModControls({
  testimonial,
  onUpdate,
  busy,
  showFeature = true,
  className,
}: {
  testimonial: ModTestimonial
  onUpdate: (id: number, patch: TestimonialPatch) => void
  busy?: boolean
  /** The wall hides the feature control; ordering is a job for the queue, not for a card in situ. */
  showFeature?: boolean
  className?: string
}) {
  const t = useT()
  const {id, status, featuredRank} = testimonial
  const featured = featuredRank !== null

  return (
    <Row
      className={clsx(
        'border-canvas-200/70 mt-4 flex-wrap items-center gap-2 border-t border-dashed pt-3',
        className,
      )}
    >
      <TestimonialStatusPill status={status} />

      {testimonial.source === 'deletion_survey' && (
        <span className="text-ink-400 text-[11px]">
          {t('testimonials.mod.from_deletion', 'from the deletion survey')}
        </span>
      )}

      <div className="flex-1" />

      {status !== 'approved' && (
        <ModAction
          tone="go"
          disabled={busy}
          icon={<CheckIcon className="h-3.5 w-3.5" />}
          onClick={() => onUpdate(id, {status: 'approved'})}
        >
          {status === 'pending'
            ? t('testimonials.mod.approve', 'Approve')
            : t('testimonials.mod.restore', 'Restore')}
        </ModAction>
      )}

      {status === 'pending' && (
        <ModAction
          tone="stop"
          disabled={busy}
          icon={<XMarkIcon className="h-3.5 w-3.5" />}
          onClick={() => onUpdate(id, {status: 'rejected'})}
        >
          {t('testimonials.mod.reject', 'Reject')}
        </ModAction>
      )}

      {status === 'approved' && (
        <ModAction
          tone="stop"
          disabled={busy}
          icon={<EyeSlashIcon className="h-3.5 w-3.5" />}
          onClick={() => onUpdate(id, {status: 'hidden'})}
        >
          {t('testimonials.mod.hide', 'Take down')}
        </ModAction>
      )}

      {status === 'hidden' && (
        <ModAction
          tone="stop"
          disabled={busy}
          icon={<ArrowUturnLeftIcon className="h-3.5 w-3.5" />}
          onClick={() => onUpdate(id, {status: 'rejected'})}
        >
          {t('testimonials.mod.reject', 'Reject')}
        </ModAction>
      )}

      {showFeature && status === 'approved' && (
        <ModAction
          disabled={busy}
          icon={
            <StarIcon
              className={clsx('h-3.5 w-3.5', featured && 'fill-primary-500 text-primary-500')}
            />
          }
          // A single rank value, not a spinner: the wall only needs "this one goes near the top", and
          // hand-managing integers across a dozen cards is a chore nobody will keep up.
          onClick={() => onUpdate(id, {featuredRank: featured ? null : 100})}
        >
          {featured
            ? t('testimonials.mod.unfeature', 'Unfeature')
            : t('testimonials.mod.feature', 'Feature')}
        </ModAction>
      )}
    </Row>
  )
}
