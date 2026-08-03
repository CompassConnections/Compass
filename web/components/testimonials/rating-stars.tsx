import {StarIcon as StarOutline} from '@heroicons/react/24/outline'
import {StarIcon as StarSolid} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {useState} from 'react'

const SIZES = {sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7'} as const

/** Read-only rating on a published testimonial. */
export function RatingStars({
  rating,
  size = 'sm',
  className,
}: {
  rating: number
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    // One label for the group rather than five icons the screen reader has to count.
    <div className={clsx('flex gap-0.5', className)} role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarSolid
          key={n}
          aria-hidden
          className={clsx(SIZES[size], n <= rating ? 'text-primary-500' : 'text-canvas-300')}
        />
      ))}
    </div>
  )
}

/**
 * The rating input.
 *
 * Hover previews the value it would set, which is the only affordance that makes a row of stars read
 * as a control rather than a decoration. Clicking the current value clears it — the rating is optional
 * and there is otherwise no way back to "no rating" once a star has been touched.
 */
export function RatingStarsInput({
  value,
  onChange,
  size = 'md',
  label,
}: {
  value: number | null
  onChange: (rating: number | null) => void
  size?: keyof typeof SIZES
  label: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const shown = hovered ?? value ?? 0

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown
        const Icon = filled ? StarSolid : StarOutline
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(n)}
            onBlur={() => setHovered(null)}
            onClick={() => onChange(value === n ? null : n)}
            className={clsx(
              'rounded-md p-0.5 transition-transform duration-100',
              'focus-visible:ring-primary-500 focus-visible:outline-none focus-visible:ring-2',
              filled ? 'scale-105' : 'hover:scale-105',
            )}
          >
            <Icon
              className={clsx(SIZES[size], filled ? 'text-primary-500' : 'text-canvas-400')}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
