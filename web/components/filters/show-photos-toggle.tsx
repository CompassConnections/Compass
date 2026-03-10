import clsx from 'clsx'
import {displayOptions} from 'common/profiles-rendering'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function ShowPhotosToggle(props: {
  displayOptions: Partial<displayOptions>
  updateDisplayOptions: (newState: Partial<displayOptions>) => void
}) {
  const {displayOptions, updateDisplayOptions} = props
  const t = useT()

  const label = t('filter.show_photos', 'Show profile pictures')

  const on = displayOptions.showPhotos ?? true

  return (
    <Row className={clsx('mr-2 items-center hover-bold', on && 'font-semibold')}>
      <input
        id={label}
        type="checkbox"
        className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-4 w-4 rounded hover:bg-canvas-200 cursor-pointer"
        checked={on}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          updateDisplayOptions({showPhotos: e.target.checked})
        }
      />
      <label htmlFor={label} className={clsx('text-ink-600 ml-2')}>
        {label}
      </label>
    </Row>
  )
}
