import clsx from 'clsx'
import {ReactNode} from 'react'

import {Card} from './card'

export type StatBoxProps = {
  // The main numeric/stat value to display large and centered
  value: string | number
  // The short label/caption shown below the value
  label?: ReactNode
  // Optional additional content (e.g., sublabel) shown below the label
  children?: ReactNode
  // Additional classes for the outer Card wrapper
  className?: string
  // Control the size of the number (default: xl)
  size?: 'lg' | 'xl' | '2xl' | '3xl'
}

/**
 * A box component that displays a large number in the center with a few words below it.
 * It composes the shared Card style for visual consistency.
 */
export function StatBox(props: StatBoxProps) {
  const {value, label, children, className, size = '2xl'} = props

  const sizeClass =
    size === '3xl'
      ? 'text-6xl'
      : size === '2xl'
        ? 'text-5xl'
        : size === 'xl'
          ? 'text-4xl'
          : 'text-3xl'

  return (
    <Card
      className={clsx(
        'flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center',
        className,
      )}
    >
      <div className={clsx('font-semibold leading-none tracking-tight', sizeClass)}>{value}</div>
      {label && <div className="text-ink-700 text-sm">{label}</div>}
      {children}
    </Card>
  )
}

export default StatBox
