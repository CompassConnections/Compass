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
          ? 'border-cta bg-cta text-white shadow-[0_2px_8px_rgba(193,127,62,0.28)]'
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
  // May be async: a parent that has to ask the server whether the name is a duplicate returns a
  // promise, and `null` from it means "handled, don't add anything here".
  addOption?: (
    label: string,
  ) =>
    | string
    | {key: string; value: string}
    | null
    | undefined
    | Promise<string | {key: string; value: string} | null | undefined>
  addPlaceholder?: string
  translationPrefix?: string
  /**
   * Whether to show the text field at all.
   *
   * Defaults to `!!addOption`, which is how this used to be wired — and that coupling was a bug on
   * the filter rail. `InterestFilter` cannot pass `addOption` (creating an option that no profile
   * holds and then filtering by it returns nothing, and writes a permanent row into the taxonomy
   * from a context where the reader is describing someone else), so it got no way to search either,
   * leaving interests as an unsearchable alphabetical wall. Searching and creating are separate
   * permissions.
   */
  searchable?: boolean
  /**
   * Whether typing filters `choices` in the browser.
   *
   * True for the static choice fields, whose options are all present locally. False when a parent is
   * driving `choices` from a server query: there, filtering again on the client would hide exactly
   * the results the server was asked for — a search for "AI" that correctly returns "Artificial
   * intelligence" contains no substring "ai".
   */
  filterLocally?: boolean
  /**
   * Makes the search field controlled by the parent. Needed when the parent can resolve a typed name
   * to an existing option (the "did you mean" path): after it selects that option on the reader's
   * behalf, the field has to empty itself, and it cannot if the text lives only in here.
   */
  searchValue?: string
  /** Notifies the parent on every keystroke, so it can run a remote search. */
  onSearchChange?: (query: string) => void
  /** Rendered under the input row — where the "did you mean" panel and the create button go. */
  searchFooter?: React.ReactNode
  /**
   * Keeps ticked options visible in the default (empty query) view even when they are not in
   * `choices`. A chip the reader has selected must never vanish just because it is too rare to be on
   * the popular first page.
   */
  pinSelected?: boolean
  /** Labels for pinned values that are not in `choices`. */
  selectedLabels?: Record<string, string>
  /**
   * Rendered as the last item of the chip row, so it wraps with the chips instead of claiming a line
   * below them. Where a `ShowMoreOptions` link goes.
   */
  trailing?: React.ReactNode
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
    searchable = !!addOption,
    filterLocally = true,
    searchValue,
    onSearchChange,
    searchFooter,
    pinSelected,
    selectedLabels,
    trailing,
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

  // With local filtering, `localChoices` is the accumulating source of truth so an optimistic add
  // survives a `choices` refresh. Without it, the parent's `choices` *is* the list to show, and
  // accumulating would be wrong: search results would pile up in the map and then all reappear the
  // moment the query was cleared, instead of the default view coming back.
  const entries = useMemo(
    () => Object.entries(filterLocally ? localChoices : choices),
    [filterLocally, localChoices, choices],
  )

  // Add-new option state. `searchValue`, when given, takes over as the source of truth.
  const [uncontrolledLabel, setUncontrolledLabel] = useState('')
  const newLabel = searchValue ?? uncontrolledLabel
  const setNewLabel = (value: string) => {
    setUncontrolledLabel(value)
    onSearchChange?.(value)
  }
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = useT()

  const translateOption = (key: string, value: string) => {
    if (!translationPrefix) return key
    return t(`${translationPrefix}.${toKey(value)}`, key)
  }

  const query = newLabel.trim()

  const filteredEntries = useMemo(() => {
    let visible = entries
    if (searchable && filterLocally && query) {
      const q = translateOption(query, query).toLowerCase()
      visible = entries.filter(([key, value]) =>
        translateOption(key, value).toLowerCase().includes(q),
      )
    }
    if (!pinSelected || query) return visible

    // Pinned values that the current page of `choices` does not contain, prepended so a rare ticked
    // option leads the list rather than being absent from it.
    const present = new Set(visible.map(([, value]) => value))
    const pinned = selected
      .filter((value) => !present.has(value))
      .map((value) => [selectedLabels?.[value] ?? value, value] as [string, string])
    return [...pinned, ...visible]
  }, [entries, searchable, filterLocally, query, pinSelected, selected, selectedLabels])

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
      const result = await addOption(label)
      if (!result) {
        // A parent that took over (to show a "did you mean" panel, or to reject the name) reports
        // its own outcome through `searchFooter`, so there is nothing to say here.
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
      {searchable && (
        <Row className="items-center gap-2">
          <Input
            value={newLabel}
            placeholder={
              addPlaceholder ??
              (addOption
                ? t('multi-checkbox.search_or_add', 'Search or add')
                : t('multi-checkbox.search', 'Search'))
            }
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
          {addOption && (
            <Button size="sm" onClick={submitAdd} loading={adding} disabled={adding}>
              {t('common.add', 'Add')}
            </Button>
          )}
          {error && <span className="text-sm text-error">{error}</span>}
        </Row>
      )}

      {searchFooter}

      <Row className={clsx('flex-wrap gap-2', optionsClassName)}>
        {filteredEntries.map(([key, value]) => (
          <OptionChip
            key={value}
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
        {trailing}
      </Row>
      {addOption && query && filteredEntries.length === 0 && !searchFooter && (
        <div className="px-2 text-sm text-ink-500">
          {t('multi-checkbox.no_matching_options', 'No matching options, feel free to add it.')}
        </div>
      )}
    </div>
  )
}
