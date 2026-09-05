import {flip, offset, shift, useFloating} from '@floating-ui/react'
import {Popover, PopoverButton, PopoverPanel} from '@headlessui/react'
import {ChevronDownIcon, XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {ReactNode, useState} from 'react'
import {Row} from 'web/components/layout/row'

import {Input} from './input'

export type Suggestion = {
  id: string
  label: string
  icon?: React.ReactNode
}

// The compact default look, sized for the social-links form. Callers that need the select to sit in a
// row of other fields (the location filter) hand in `triggerClassName` / `panelClassName` instead, which
// *replace* these rather than append to them — tailwind resolves a `rounded-md` vs `rounded-xl` clash by
// stylesheet order, not by which class came last, so appending could never reliably override.
const DEFAULT_TRIGGER_CLASSNAME =
  'bg-canvas-50 border-ink-300 w-32 rounded-md border px-3 py-2 text-sm shadow-sm'
const DEFAULT_PANEL_CLASSNAME =
  'bg-canvas-50 ring-ink-1000 w-48 rounded-md shadow-lg ring-1 ring-opacity-5'

export function SearchableSelect(props: {
  value: string
  onChange: (value: string) => void
  suggestions: Suggestion[]
  placeholder?: string
  parentClassName?: string
  /** Appended to the trigger's classes. Layout tweaks only; see `triggerClassName` for a new look. */
  className?: string
  /** Replaces the trigger's default visual classes (background, border, radius, size). */
  triggerClassName?: string
  /** Replaces the panel's default visual classes (background, border, radius, width). */
  panelClassName?: string
  /** Leading icon in the trigger, like the magnifier of a search `Input`. */
  icon?: ReactNode
  searchPlaceholder?: string
  /** When set, a "clear" row (this label) tops the list whenever something is selected. */
  clearLabel?: string
  allowCustom?: boolean
}) {
  const {
    value,
    onChange,
    suggestions,
    placeholder,
    parentClassName,
    className,
    triggerClassName,
    panelClassName,
    icon,
    searchPlaceholder,
    clearLabel,
    allowCustom,
  } = props
  const [query, setQuery] = useState('')

  const {refs, floatingStyles} = useFloating({
    placement: 'bottom-start',
    middleware: [offset(4), flip(), shift({padding: 8})],
  })

  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase()),
  )
  const showCustom = allowCustom && query.length > 0 && filteredSuggestions.length === 0
  const currentSuggestion = suggestions.find((s) => s.id === value)
  const showClear = !!clearLabel && !!value && query === ''

  // Every way of leaving the list goes through here so the search box comes back empty next time:
  // a query that outlives the pick would filter the list down to the one country already chosen.
  const pick = (next: string, close: () => void) => {
    onChange(next)
    setQuery('')
    close()
  }
  // An empty selection shows its placeholder in the same muted tone an empty `Input` does, so the
  // field does not read as filled.
  const hasSelection = !!(currentSuggestion?.label || value)

  return (
    <Popover className={clsx('relative', parentClassName)}>
      {({close}) => (
        <>
          <PopoverButton
            ref={refs.setReference}
            className={clsx(
              'flex items-center justify-between gap-2 text-left focus:outline-none',
              triggerClassName ?? DEFAULT_TRIGGER_CLASSNAME,
              className,
            )}
          >
            <Row className="min-w-0 items-center gap-2">
              {icon}
              <span className={clsx('truncate', !hasSelection && 'text-ink-500')}>
                {currentSuggestion?.label || value || placeholder || 'Select...'}
              </span>
            </Row>
            <ChevronDownIcon className="h-4 w-4 flex-shrink-0 text-ink-500" />
          </PopoverButton>

          <PopoverPanel
            ref={refs.setFloating}
            style={floatingStyles}
            className={clsx(
              'z-30 mt-1 focus:outline-none',
              panelClassName ?? DEFAULT_PANEL_CLASSNAME,
            )}
          >
            <div className="p-2">
              {/* The same search pill as the page's "Search anything..." bar: magnifier on the left
                  and an X to clear the text once something is typed. Compact height only. */}
              <Input
                type="text"
                value={query}
                onChange={(e: any) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? 'Search...'}
                className="mb-2 w-full !h-10"
                autoFocus
                searchIcon
              />
              <div className="max-h-48 space-y-1 overflow-auto">
                {showClear && (
                  <button
                    className="hover:bg-primary-100 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                    onClick={() => pick('', close)}
                  >
                    <XMarkIcon className="h-4 w-4 text-ink-400" />
                    <span>{clearLabel}</span>
                  </button>
                )}
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className={clsx(
                      'hover:bg-primary-100 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                      value === suggestion.id && 'bg-primary-50',
                    )}
                    onClick={() => pick(suggestion.id, close)}
                  >
                    {suggestion.icon}
                    <span>{suggestion.label}</span>
                  </button>
                ))}
                {showCustom && (
                  <button
                    className="hover:bg-primary-100 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                    onClick={() => pick(query, close)}
                  >
                    Add custom: "{query}"
                  </button>
                )}
              </div>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}
