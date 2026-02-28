import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {generateChoicesMap, hasKidsLabels} from 'common/has-kids'
import {invert} from 'lodash'
import {DropdownOptions} from 'web/components/comments/dropdown-menu'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

const DEFAULT_KEY = -1

export function HasKidsLabel(props: {
  has_kids: number
  highlightedClass?: string
  mobile?: boolean
}) {
  const {highlightedClass} = props
  const t = useT()

  const has_kids = Number(props.has_kids)

  // Get the appropriate label based on has_kids value
  let labelKey = 'no_preference'
  let labelValue = hasKidsLabels.no_preference.name

  if (has_kids === hasKidsLabels.has_kids.value) {
    labelKey = 'has_kids'
    labelValue = hasKidsLabels.has_kids.name
  } else if (has_kids === hasKidsLabels.doesnt_have_kids.value) {
    labelKey = 'doesnt_have_kids'
    labelValue = hasKidsLabels.doesnt_have_kids.name
  }
  return (
    <Row className="items-center gap-0.5">
      {/*<FaChild className="h-4 w-4" />*/}
      <span className={clsx(highlightedClass, has_kids !== DEFAULT_KEY && 'font-semibold')}>
        {has_kids === DEFAULT_KEY && t('filter.label.has_kids', 'Kids') + ': '}
        {t(`profile.has_kids.${labelKey}`, labelValue)}
      </span>
    </Row>
  )
}

export function HasKidsFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <DropdownOptions
      items={invert(generateChoicesMap(hasKidsLabels))}
      activeKey={String(filters.has_kids ?? DEFAULT_KEY)}
      translationPrefix="profile.has_kids"
      onClick={(key) => {
        updateFilter({has_kids: Number(key) === DEFAULT_KEY ? undefined : key})
      }}
    />
  )
}
