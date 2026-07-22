import clsx from 'clsx'
import {InputHTMLAttributes, ReactNode} from 'react'

// Shared building blocks for the /register and /signin pages so the two stay in
// visual lockstep. Mirrors the home page design language: warm tokens, a soft
// radial glow for depth, and staggered fade-up entrances.

/** Page wrapper: centers the card and paints the hero-style radial glow behind it. */
export function AuthShell({children}: {children: ReactNode}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Soft radial glow behind the card for depth — mirrors the home hero.
          Dark mode uses a brighter, lighter-hued, faster-falloff core so it reads
          as light, not brown haze. */}
      {/*<div*/}
      {/*  aria-hidden*/}
      {/*  className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_55%_at_50%_28%,rgba(193,127,62,0.16),transparent_70%)] dark:h-[360px] dark:bg-[radial-gradient(ellipse_48%_42%_at_50%_22%,rgba(224,162,102,0.22),rgba(193,127,62,0.06)_45%,transparent_64%)]"*/}
      {/*/>*/}
      <div className="max-w-md w-full space-y-8">{children}</div>
    </div>
  )
}

/** Favicon + title + optional subtitle. */
export function AuthHeader({title, subtitle}: {title: string; subtitle?: string}) {
  return (
    <div className="animate-fade-up">
      {/*<div className="flex justify-center mb-6">*/}
      {/*  <FavIconBlack className="dark:invert" />*/}
      {/*</div>*/}
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink-1000">{title}</h2>
      {subtitle && <p className="mt-3 text-center text-ink-600">{subtitle}</p>}
    </div>
  )
}

/** The form element, with the standard entrance animation. */
export function AuthForm({
  onSubmit,
  children,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  children: ReactNode
}) {
  return (
    <form
      className="mt-8 space-y-6 animate-fade-up"
      style={{animationDelay: '80ms'}}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  )
}

/** Wraps stacked inputs so adjacent borders collapse into one. */
export function AuthFieldGroup({children}: {children: ReactNode}) {
  return <div className="-space-y-px">{children}</div>
}

const authInputBase =
  'bg-canvas-50 appearance-none relative block w-full px-4 py-3 border-[1.5px] border-canvas-200 text-ink-1000 placeholder-ink-400 transition-colors focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:z-10 sm:text-sm'

/** Email/password input with a screen-reader label. `position` rounds the outer corner. */
export function AuthInput({
  position,
  label,
  below,
  className,
  ...props
}: {
  position: 'top' | 'bottom'
  label: string
  below?: ReactNode
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={props.id} className="sr-only">
        {label}
      </label>
      <input
        className={clsx(
          authInputBase,
          position === 'top' ? 'rounded-t-xl' : 'rounded-b-xl',
          className,
        )}
        {...props}
      />
      {below}
    </div>
  )
}

/** Gradient rule with a centered label. */
export function AuthDivider({label}: {label: string}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-canvas-300 to-transparent" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 body-bg text-ink-500">{label}</span>
      </div>
    </div>
  )
}

/** Primary CTA, matching the home hero button (amber, shadow, hover lift). */
export function AuthSubmitButton({
  isLoading,
  children,
}: {
  isLoading?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={clsx(
        'group relative w-full flex justify-center py-3.5 px-4 text-[15px] font-bold rounded-xl text-white bg-cta shadow-[0_4px_16px_rgba(193,127,62,0.35)] transition-all duration-150 hover:bg-cta-hover hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,62,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        isLoading && 'opacity-70 cursor-not-allowed hover:translate-y-0',
      )}
    >
      {children}
    </button>
  )
}

/** Centered error message. Renders nothing when empty. */
export function AuthError({children}: {children: ReactNode}) {
  if (!children) return null
  return <div className="text-red-500 text-sm text-center">{children}</div>
}

/** Footer line ("Already have an account?" etc.) with link styling + entrance. */
export function AuthFooter({children}: {children: ReactNode}) {
  return (
    <div
      className="text-center text-ink-600 custom-link animate-fade-up"
      style={{animationDelay: '160ms'}}
    >
      <p>{children}</p>
    </div>
  )
}
