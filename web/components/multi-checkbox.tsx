import {CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {toKey} from 'common/parsing'
import {nullifyEmpty} from 'common/util/array'
import {useEffect, useMemo, useState} from 'react'
import {Button} from 'web/components/buttons/button'
import {Row} from 'web/components/layout/row'
import {Input} from 'web/components/widgets/input'
import {useT} from 'web/lib/locale'

/**
 * A selectable option, styled as a chip rather than a checkbox-and-label row.
 *
 * The filter rail used native checkboxes in uniform `text-ink-600`, which read as washed out and gave
 * no visual weight to what was actually selected. Chips reuse the language already on profile cards
 * (keywords, interests) so the filters and the results they produce look like the same product, and a
 * filled chip makes the current selection obvious at a glance.
 *
 * Still a real `<input type="checkbox">` underneath — visually hidden, not replaced — so keyboard
 * navigation, focus order and screen-reader semantics are unchanged.
 */
function OptionChip(props: {
  label: string
  checked: boolean
  toggle: (checked: boolean) => void
  disabled?: boolean
}) {
  const {label, checked, toggle, disabled} = props

  return (
    <label
      className={clsx(
        'group relative inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
        'focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-1 focus-within:ring-offset-canvas-50',
        disabled && 'cursor-not-allowed opacity-50',
        checked
          ? 'border-primary-500 bg-primary-500 text-white shadow-[0_2px_8px_rgba(193,127,62,0.28)]'
          : 'border-canvas-300 bg-canvas-0 text-ink-600 hover:border-primary-400 hover:text-primary-700',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => toggle(e.target.checked)}
      />
      {checked && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
      <span className="whitespace-nowrap">{label}</span>
    </label>
  )
}

export const MultiCheckbox = (props: {
  // Map of label -> value
  choices: {[key: string]: string}
  // Selected values (should match the "value" side of choices)
  selected: string[]
  onChange: (selected: string[] | null) => void
  className?: string
  optionsClassName?: string
  // If provided, enables adding a new option and should persist it (e.g. to DB)
  // Return value can be:
  //  - string: the stored value for the new option; label will be the input text
  //  - { key, value }: explicit label (key) and stored value
  //  - null/undefined to indicate failure/cancellation
  addOption?: (label: string) => string | {key: string; value: string} | null | undefined
  addPlaceholder?: string
  translationPrefix?: string
}) => {
  const {
    choices,
    selected,
    onChange,
    className,
    optionsClassName,
    addOption,
    addPlaceholder,
    translationPrefix,
  } = props

  // Keep a local merged copy to allow optimistic adds while remaining in sync with props
  const [localChoices, setLocalChoices] = useState<{[key: string]: string}>(choices)
  useEffect(() => {
    setLocalChoices((prev) => {
      // If incoming choices changed, merge them with any locally added that still don't collide
      // Props should be source of truth on conflicts
      return {...prev, ...choices}
    })
  }, [choices])

  const entries = useMemo(() => Object.entries(localChoices), [localChoices])

  // Add-new option state
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = useT()

  const translateOption = (key: string, value: string) => {
    if (!translationPrefix) return key
    return t(`${translationPrefix}.${toKey(value)}`, key)
  }

  // Filter visible options while typing a new option (case-insensitive label match)
  const filteredEntries = useMemo(() => {
    if (!addOption) return entries
    let q = newLabel.trim()
    q = translateOption(q, q).toLowerCase()
    if (!q) return entries
    return entries.filter(([key, value]) => translateOption(key, value).toLowerCase().includes(q))
  }, [addOption, entries, newLabel])

  const submitAdd = async () => {
    if (!addOption) return
    const label = newLabel.trim()
    setError(null)
    if (!label) {
      setError(t('multi-checkbox.enter_value', 'Please enter a value.'))
      return
    }
    // prevent duplicate by label or by value already selected
    const existingEntry = Object.entries(localChoices).find(
      ([key, value]) =>
        translateOption(key, value).toLowerCase() === translateOption(label, label).toLowerCase(),
    )

    if (existingEntry) {
      const [_, existingValue] = existingEntry
      if (!selected.includes(existingValue)) {
        onChange([...selected, existingValue])
      }
      setNewLabel('')
      return
    }
    setAdding(true)
    try {
      const result = addOption(label)
      if (!result) {
        setError(t('multi-checkbox.could_not_add', 'Could not add option.'))
        setAdding(false)
        return
      }
      const {key, value} = typeof result === 'string' ? {key: label, value: result} : result
      setLocalChoices((prev) => ({...prev, [key]: value}))
      // auto-select newly added option if not already selected
      if (!selected.includes(value)) onChange([...selected, value])
      setNewLabel('')
    } catch (_e) {
      setError(t('multi-checkbox.add_failed', 'Failed to add option.'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {addOption && (
        <Row className="items-center gap-2">
          <Input
            value={newLabel}
            placeholder={addPlaceholder ?? t('multi-checkbox.search_or_add', 'Search or add')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewLabel(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitAdd()
              }
            }}
            className="h-10"
            searchIcon
          />
          <Button size="sm" onClick={submitAdd} loading={adding} disabled={adding}>
            {t('common.add', 'Add')}
          </Button>
          {error && <span className="text-sm text-error">{error}</span>}
        </Row>
      )}

      <Row className={clsx('flex-wrap gap-2', optionsClassName)}>
        {filteredEntries.map(([key, value]) => (
          <OptionChip
            key={key}
            label={translateOption(key, value)}
            checked={selected.includes(value)}
            toggle={(checked: boolean) => {
              if (checked) {
                onChange([...selected, value])
              } else {
                onChange(nullifyEmpty(selected.filter((s) => s !== value)))
              }
            }}
          />
        ))}
      </Row>
      {addOption && newLabel.trim() && filteredEntries.length === 0 && (
        <div className="px-2 text-sm text-ink-500">
          {t('multi-checkbox.no_matching_options', 'No matching options, feel free to add it.')}
        </div>
      )}
    </div>
  )
}
