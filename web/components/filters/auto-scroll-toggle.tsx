import clsx from 'clsx'
import {DisplayOptions} from 'common/profiles-rendering'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

// Off by default: the grid then ends in a "Load more" button rather than paging on its own as the
// reader nears the bottom. Ticking this restores infinite scroll for people who prefer it.
export function AutoScrollToggle(props: {
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const {displayOptions, updateDisplayOptions} = props
  const t = useT()

  const on = displayOptions.autoScroll ?? false

  return (
    <Row className={clsx('mr-2 items-center hover-bold', on && 'font-semibold')}>
      <input
        id="autoScroll"
        type="checkbox"
        className="border-ink-300 bg-canvas-50 dark:border-ink-500 text-primary-700 focus:ring-primary-500 h-4 w-4 rounded hover:bg-canvas-200 cursor-pointer"
        checked={on}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          updateDisplayOptions({autoScroll: e.target.checked})
        }
      />
      <label htmlFor="autoScroll" className="text-ink-600 ml-2 text-sm cursor-pointer">
        {t('filter.auto_scroll', 'Load more as I scroll')}
      </label>
    </Row>
  )
}
