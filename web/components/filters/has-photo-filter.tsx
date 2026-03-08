import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function HasPhotoFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  const t = useT()

  const label = t('filter.has_photo', 'Has photos')
  const on = filters.hasPhoto ?? false

  return (
    <Row className={clsx('mx-2 items-center hover-bold', on && 'font-semibold')}>
      <input
        id={label}
        type="checkbox"
        className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-4 w-4 rounded hover:bg-canvas-200 cursor-pointer"
        checked={on}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          updateFilter({hasPhoto: e.target.checked ? true : undefined})
        }
      />
      <label htmlFor={label} className={clsx('text-ink-600 ml-2')}>
        {label}
      </label>
    </Row>
  )
}
