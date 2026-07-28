import clsx from 'clsx'
import {CSSProperties, ReactNode} from 'react'
import {Col} from 'web/components/layout/col'
import {surface} from 'web/components/widgets/surface'

/**
 * The settings page's two building blocks.
 *
 * The General tab used to be a flat run of `<h3>` + control in a single `gap-2` column: eight
 * sections at identical visual weight, so nothing could read as more or less important, and the
 * container's `max-w-fit` collapsed the whole thing to ~400px against a full-width page. The
 * Notifications tab, meanwhile, already grouped its rows into bordered cards — the same page
 * disagreeing with itself about what a settings section looks like.
 *
 * These two components are that card treatment, generalised. `SettingsCard` inherits `surface` from
 * `widgets/surface` — the vocabulary `/about` and `/home` already use — rather than inventing a
 * third elevation.
 */

/**
 * One group of related settings: icon, title, one-line description, then a divided list of rows.
 *
 * `data-form-section` is what the section index reads to build itself (see `ProfileFormNav`), so the
 * markup stays the source of truth for what sections exist and in what order.
 */
export function SettingsCard(props: {
  id: string
  title: string
  description?: string
  icon: ReactNode
  /** `danger` tints the ring and the icon chip red. Reserved for irreversible actions. */
  tone?: 'default' | 'danger'
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const {id, title, description, icon, tone = 'default', className, style, children} = props
  const isDanger = tone === 'danger'

  return (
    <section
      id={id}
      data-form-section={title}
      style={style}
      className={clsx(
        surface,
        'animate-fade-up overflow-hidden',
        // `red`, not `scarlet` — the latter is this theme's grey "no" token, not a red.
        isDanger && '!ring-red-500/30',
        className,
      )}
    >
      {/* The icon is centred on the title line, not on the title-plus-description block: aligned to
          the block it floats between the two lines, level with neither. The description then hangs
          at `pl-12` (chip + gap) so it still starts on the title's left edge. */}
      <header className="border-canvas-200/70 border-b px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={clsx(
              'flex h-9 w-9 flex-none items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5',
              isDanger
                ? 'bg-red-500/10 text-red-500'
                : 'bg-primary-500/10 text-primary-600 dark:text-primary-500',
            )}
          >
            {icon}
          </span>
          <h2 className="text-ink-1000 min-w-0 text-base font-semibold leading-tight">{title}</h2>
        </div>
        {description && (
          <p className="text-ink-500 mt-2 pl-12 text-sm leading-snug">{description}</p>
        )}
      </header>
      <Col className="divide-canvas-200/70 divide-y">{children}</Col>
    </section>
  )
}

/**
 * One setting: what it is on the left, the control that changes it on the right.
 *
 * The pattern is lifted from `ConnectionPreferencesSettings`, which was already the only part of the
 * General tab that explained its own options. Applying it to language/theme/font/units turns four
 * orphaned headings into four rows of one card.
 *
 * Below `sm` the control drops under the label rather than squeezing beside it — a `<select>` and a
 * three-way pill group have no useful narrow form.
 */
export function SettingsRow(props: {
  label: ReactNode
  description?: ReactNode
  /** Renders the label as a `<label for=...>` when the control is a real form element. */
  htmlFor?: string
  /** Stacks the control under the label at every width. For controls that need the room. */
  stacked?: boolean
  className?: string
  children: ReactNode
}) {
  const {label, description, htmlFor, stacked, className, children} = props
  const Label = htmlFor ? 'label' : 'div'

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 px-4 py-4 sm:px-5',
        !stacked && 'sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0">
        <Label
          htmlFor={htmlFor}
          className={clsx('text-ink-1000 block text-sm font-medium', htmlFor && 'cursor-pointer')}
        >
          {label}
        </Label>
        {description && <p className="text-ink-500 mt-1 text-sm leading-snug">{description}</p>}
      </div>
      <div className={clsx('min-w-0', !stacked && 'sm:flex-none')}>{children}</div>
    </div>
  )
}
