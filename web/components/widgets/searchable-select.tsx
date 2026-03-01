import {flip, offset, shift, useFloating} from '@floating-ui/react'
import {Popover, PopoverButton, PopoverPanel} from '@headlessui/react'
import {ChevronDownIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {useState} from 'react'

import {Input} from './input'

export type Suggestion = {
  id: string
  label: string
  icon?: React.ReactNode
}

export function SearchableSelect(props: {
  value: string
  onChange: (value: string) => void
  suggestions: Suggestion[]
  placeholder?: string
  parentClassName?: string
  className?: string
  allowCustom?: boolean
}) {
  const {value, onChange, suggestions, placeholder, parentClassName, className, allowCustom} = props
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

  return (
    <Popover className={clsx('relative', parentClassName)}>
      {({close}) => (
        <>
          <PopoverButton
            ref={refs.setReference}
            className={clsx(
              'bg-canvas-0 border-ink-300 flex w-32 items-center justify-between rounded-md border px-3 py-2 text-left text-sm shadow-sm focus:outline-none',
              className,
            )}
          >
            <span className="truncate">
              {currentSuggestion?.label || value || placeholder || 'Select...'}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </PopoverButton>

          <PopoverPanel
            ref={refs.setFloating}
            style={floatingStyles}
            className="bg-canvas-0 ring-ink-1000 z-30 mt-1 w-48 rounded-md shadow-lg ring-1 ring-opacity-5 focus:outline-none"
          >
            <div className="p-2">
              <Input
                type="text"
                value={query}
                onChange={(e: any) => setQuery(e.target.value)}
                placeholder="Search..."
                className="mb-2 w-full"
              />
              <div className="max-h-48 space-y-1 overflow-auto">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className={clsx(
                      'hover:bg-primary-100 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                      value === suggestion.id && 'bg-primary-50',
                    )}
                    onClick={() => {
                      onChange(suggestion.id)
                      close()
                    }}
                  >
                    {suggestion.icon}
                    <span>{suggestion.label}</span>
                  </button>
                ))}
                {showCustom && (
                  <button
                    className="hover:bg-primary-100 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                    onClick={() => {
                      onChange(query)
                      close()
                    }}
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
