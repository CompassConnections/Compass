import clsx from 'clsx'
import {Row} from 'web/components/layout/row'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {FaChild} from 'react-icons/fa6'
import {FilterFields} from 'common/filters'
import {generateChoicesMap, hasKidsLabels} from 'common/has-kids'
import {useT} from 'web/lib/locale'


export function HasKidsLabel(props: {
  has_kids: number
  highlightedClass?: string
  mobile?: boolean
}) {
  const {has_kids, highlightedClass, mobile} = props
  const t = useT()

  // Get the appropriate label based on has_kids value
  let labelKey = 'no_preference'
  let labelValue = hasKidsLabels.no_preference.name

  if (has_kids === hasKidsLabels.has_kids.value) {
    labelKey = 'has_kids'
    labelValue = mobile ? hasKidsLabels.has_kids.shortName : hasKidsLabels.has_kids.name
  } else if (has_kids === hasKidsLabels.doesnt_have_kids.value) {
    labelKey = 'doesnt_have_kids'
    labelValue = mobile ? hasKidsLabels.doesnt_have_kids.shortName : hasKidsLabels.doesnt_have_kids.name
  }
  return (
    <Row className="items-center gap-0.5">
      <FaChild className="hidden h-4 w-4 sm:inline"/>
      <span
        className={clsx(highlightedClass, has_kids !== -1 && 'font-semibold')}
      >
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
    <ChoicesToggleGroup
      currentChoice={filters.has_kids ?? 0}
      choicesMap={generateChoicesMap(hasKidsLabels)}
      translationPrefix="profile.has_kids"
      setChoice={(c) => updateFilter({has_kids: Number(c)})}
      toggleClassName="w-1/3 justify-center"
    />
  )
}
