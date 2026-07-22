import clsx from 'clsx'
import {ComponentPropsWithoutRef, forwardRef, MouseEventHandler, ReactNode, Ref} from 'react'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'

export type SizeType = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type ColorType =
  | 'green'
  | 'green-outline'
  | 'red'
  | 'red-outline'
  | 'blue'
  | 'sky-outline'
  | 'indigo'
  | 'indigo-outline'
  | 'yellow'
  | 'gray'
  | 'gray-outline'
  | 'gradient'
  | 'gradient-pink'
  | 'gray-white'
  | 'yellow-outline'
  | 'gold'
  | 'none'
  | 'primary'
  | 'cta'

const sizeClasses = {
  '2xs': 'px-2 py-1 text-xs',
  xs: 'px-2.5 py-1.5 text-sm',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-2 text-base',
  xl: 'px-6 py-2.5 text-base font-semibold',
  '2xl': 'px-6 py-3 text-xl font-semibold',
}

export const baseButtonClasses =
  'font-md inline-flex items-center justify-center rounded-md ring-inset transition-colors disabled:cursor-not-allowed text-center'

const solid = 'disabled:bg-canvas-200 text-white'
export const outline =
  'ring-1 ring-current ring-canvas-200 disabled:ring-canvas-200 disabled:text-canvas-200 disabled:bg-inherit'
const gradient = [solid, 'bg-gradient-to-r hover:saturate-150 disabled:bg-none']

export function buttonClass(size: SizeType, color: ColorType) {
  return clsx(
    baseButtonClasses,
    sizeClasses[size],
    color === 'green' && [solid, 'bg-teal-500 hover:bg-teal-600'],
    color === 'green-outline' && [outline, 'text-teal-500 hover:bg-teal-500'],
    color === 'red' && [solid, 'bg-red-500 hover:bg-red-600'],
    color === 'red-outline' && [outline, 'text-scarlet-500 hover:bg-scarlet-500'],
    color === 'yellow' && [solid, 'bg-yellow-400 hover:bg-yellow-500'],
    color === 'yellow-outline' && [outline, 'text-yellow-500 hover:bg-yellow-500'],
    color === 'blue' && [solid, 'bg-blue-400 hover:bg-blue-500'],
    color === 'sky-outline' && [outline, 'text-sky-500 hover:bg-sky-500'],
    color === 'indigo' && [solid, 'bg-cta hover:bg-cta-hover'],
    // The conversion CTA (sign-up). Distinct from 'primary', which is the *tinted* secondary
    // (amber-on-tan) and is used as such in three other places — the sign-up button was borrowing it
    // and so rendered as a low-emphasis pill. It also hardcodes `px-4 py-2 text-sm`, which silently
    // fought the `size="xl"` its callers were passing.
    color === 'cta' && [
      solid,
      '!rounded-xl bg-cta hover:bg-cta-hover shadow-[0_6px_20px_-8px_rgb(var(--color-cta)/0.75)]',
    ],
    color === 'indigo-outline' && [outline, 'text-primary-500 hover:bg-primary-500'],
    color === 'gray' &&
      'bg-canvas-200 text-ink-900 disabled:bg-ink-200 disabled:text-ink-500 hover:bg-canvas-300 hover:text-ink-1000',
    // ink-600 on the page canvas is 4.2:1 at 14px, just under AA; ink-700 clears it.
    color === 'gray-outline' && [outline, 'text-ink-700 hover:bg-canvas-25'],
    color === 'gradient' && [gradient, 'from-cta to-cta-deep'],
    color === 'gradient-pink' && [gradient, 'from-primary-500 to-fuchsia-500'],
    color === 'gray-white' &&
      'text-ink-500 hover:text-ink-900 disabled:text-ink-300 disabled:bg-transparent',
    color === 'gold' && [
      gradient,
      'enabled:!bg-gradient-to-br from-yellow-400 via-yellow-100 to-yellow-300 dark:from-yellow-600 dark:via-yellow-200 dark:to-yellow-400 !text-gray-900',
    ],
    color === 'primary' &&
      'w-fit border-canvas-300 text-primary-700 bg-canvas-200 hover:bg-canvas-300 mb-4 !rounded-full border px-4 py-2 text-sm transition-colors',
  )
}

export const Button = forwardRef(function Button(
  props: {
    className?: string
    size?: SizeType
    color?: ColorType | null
    type?: 'button' | 'reset' | 'submit'
    loading?: boolean
  } & ComponentPropsWithoutRef<'button'>,
  ref: Ref<HTMLButtonElement>,
) {
  const {
    children,
    className,
    size = 'md',
    color = 'gray-outline',
    type = 'button',
    disabled = false,
    loading,
    ...rest
  } = props

  return (
    <button
      type={type}
      className={clsx(color && buttonClass(size, color), className)}
      disabled={disabled || loading}
      ref={ref}
      {...rest}
    >
      {loading && (
        <LoadingIndicator
          className="mr-2 w-fit self-stretch"
          size={size === '2xs' || size === 'xs' ? 'sm' : 'md'}
          spinnerClassName="!w-[unset] aspect-square"
        />
      )}
      {children}
    </button>
  )
})

export function IconButton(props: {
  className?: string
  onClick?: MouseEventHandler<any> | undefined
  children?: ReactNode
  size?: SizeType
  type?: 'button' | 'reset' | 'submit'
  disabled?: boolean
}) {
  const {children, className, onClick, size = 'md', type = 'button', disabled = false} = props

  return (
    <Button
      type={type}
      size={size}
      color="gray-white"
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
