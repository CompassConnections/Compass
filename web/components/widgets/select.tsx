import clsx from 'clsx'
import {forwardRef} from 'react'

export const Select = forwardRef<HTMLSelectElement, JSX.IntrinsicElements['select']>(
  (props, ref) => {
    const {className, children, ...rest} = props

    return (
      <select
        ref={ref}
        className={clsx(
          'bg-canvas-0 text-ink-1000 border-ink-300 focus:border-primary-500 focus:ring-primary-500 h-12 cursor-pointer self-start overflow-hidden rounded-md border pl-4 pr-10 text-sm shadow-sm focus:outline-none',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    )
  },
)
