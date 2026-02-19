import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function MyMatchesToggle(props: {
  setYourFilters: (checked: boolean) => void
  youProfile: Profile | undefined | null
  on: boolean
  hidden: boolean
}) {
  const {setYourFilters, on, hidden} = props
  const t = useT()
  if (hidden) {
    return <></>
  }

  const label = t('filter.mine_toggle', 'Your filters')

  return (
    <Row className={clsx('mr-2 items-center hover-bold', on && 'font-semibold')}>
      <input
        id={label}
        type="checkbox"
        className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-4 w-4 rounded hover:bg-canvas-200"
        checked={on}
        onChange={(e) => setYourFilters(e.target.checked)}
      />
      <label htmlFor={label} className={clsx('text-ink-600 ml-2')}>
        {label}
      </label>
    </Row>
  )
}
