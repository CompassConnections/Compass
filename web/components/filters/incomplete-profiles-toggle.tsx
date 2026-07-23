import {CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function IncompleteProfilesToggle(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  hidden: boolean
}) {
  const {filters, updateFilter, hidden} = props
  const t = useT()
  if (hidden) {
    return <></>
  }

  const label = t('filter.short_bio_toggle', 'Include incomplete profiles')

  const checked = filters.shortBio || false

  // Styled as a chip, matching the connection filter's OptionChip, so the whole rail reads as one
  // product. Still a real visually-hidden checkbox underneath, so keyboard and screen-reader
  // semantics are unchanged.
  return (
    <Row className="mr-2">
      <label
        className={clsx(
          'group relative inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
          'focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-1 focus-within:ring-offset-canvas-50',
          checked
            ? 'border-cta bg-cta text-white shadow-[0_2px_8px_rgba(193,127,62,0.28)]'
            : 'border-canvas-300 bg-canvas-0 text-ink-600 hover:border-primary-400 hover:text-primary-700',
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateFilter({shortBio: e.target.checked ? true : undefined})
          }
        />
        {checked && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
        <span className="whitespace-nowrap">{label}</span>
      </label>
    </Row>
  )
}
