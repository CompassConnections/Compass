import {Row} from 'web/components/layout/row'
import {Checkbox} from 'web/components/widgets/checkbox'
import {Input} from 'web/components/widgets/input'
import {Button} from 'web/components/buttons/button'
import clsx from 'clsx'
import {useEffect, useMemo, useState} from 'react'
import {useT} from 'web/lib/locale'
import {toKey} from 'common/parsing'

export const MultiCheckbox = (props: {
  // Map of label -> value
  choices: {[key: string]: string}
  // Selected values (should match the "value" side of choices)
  selected: string[]
  onChange: (selected: string[]) => void
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
            onChange={(e) => {
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
          />
          <Button size="sm" onClick={submitAdd} loading={adding} disabled={adding}>
            {t('common.add', 'Add')}
          </Button>
          {error && <span className="text-sm text-error">{error}</span>}
        </Row>
      )}

      <Row className={clsx('flex-wrap', optionsClassName)}>
        {filteredEntries.map(([key, value]) => (
          <Checkbox
            key={key}
            label={translateOption(key, value)}
            checked={selected.includes(value)}
            toggle={(checked: boolean) => {
              if (checked) {
                onChange([...selected, value])
              } else {
                onChange(selected.filter((s) => s !== value))
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
