import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {Row} from 'web/components/layout/row'
import {Checkbox} from 'web/components/widgets/checkbox'
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

  return (
    <Row className={clsx('mr-2', checked && 'font-semibold')}>
      <Checkbox
        label={label}
        checked={checked}
        toggle={(checked) => updateFilter({shortBio: checked ? true : undefined})}
      />
    </Row>
  )
}
