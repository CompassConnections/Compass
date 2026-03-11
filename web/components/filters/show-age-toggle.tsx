import clsx from 'clsx'
import {DisplayOptions} from 'common/profiles-rendering'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function ShowAgeToggle(props: {
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const {displayOptions, updateDisplayOptions} = props
  const t = useT()

  const label = t('filter.show_age', 'Show age')

  const on = displayOptions.showAge ?? true

  return (
    <Row className={clsx('mr-2 items-center hover-bold', on && 'font-semibold')}>
      <input
        id={label}
        type="checkbox"
        className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-4 w-4 rounded hover:bg-canvas-200 cursor-pointer"
        checked={on}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          updateDisplayOptions({showAge: e.target.checked})
        }
      />
      <label htmlFor={label} className={clsx('text-ink-600 ml-2')}>
        {label}
      </label>
    </Row>
  )
}
