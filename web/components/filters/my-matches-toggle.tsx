import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {Row} from 'web/components/layout/row'
import {Checkbox} from 'web/components/widgets/checkbox'
import {useT} from 'web/lib/locale'

export function MyMatchesToggle(props: {
  setYourFilters: (checked: boolean) => void
  youProfile: Profile | undefined | null
  checked: boolean
  hidden: boolean
}) {
  const {setYourFilters, checked, hidden} = props
  const t = useT()
  if (hidden) {
    return <></>
  }

  const label = t('filter.mine_toggle', 'Your filters')

  return (
    <Row className={clsx('mr-2', checked && 'font-semibold')}>
      <Checkbox label={label} checked={checked} toggle={setYourFilters} />
    </Row>
  )
}
