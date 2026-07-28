import clsx from 'clsx'
import {ComponentPropsWithoutRef, forwardRef} from 'react'

export const Select = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(
  (props, ref) => {
    const {className, children, ...rest} = props

    return (
      <select
        ref={ref}
        className={clsx(
          // Matches Input: same border token, same hover, same focus ring. It sat on `border-ink-300` with a
          // bare 1px focus border, so a select and a text field next to each other looked unrelated.
          'bg-canvas-50 text-ink-1000 border-canvas-300 h-12 cursor-pointer self-start overflow-hidden rounded-xl border pl-4 pr-10 text-sm shadow-sm transition-all duration-150 hover:border-primary-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    )
  },
)
