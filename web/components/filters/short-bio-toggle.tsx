import {Row} from 'web/components/layout/row'
import clsx from 'clsx'
import {FilterFields} from "common/filters";
import {useT} from "web/lib/locale";

export function ShortBioToggle(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  hidden: boolean
}) {
  const {filters, updateFilter, hidden} = props
  if (hidden) {
    return <></>
  }

  const t = useT()
  const label = t('filter.short_bio_toggle', 'Include Short Bios')

  const on = filters.shortBio || false

  return (
    <Row className={clsx('mr-2 items-center', on && 'font-semibold')}>
      <input
        id={label}
        type="checkbox"
        className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-4 w-4 rounded"
        checked={on}
        onChange={(e) => updateFilter({shortBio: e.target.checked ? true : undefined})}
      />
      <label htmlFor={label} className={clsx('text-ink-600 ml-2')}>
        {label}
      </label>
    </Row>
  )
}
