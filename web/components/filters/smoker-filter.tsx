import clsx from 'clsx'
import {Row} from 'web/components/layout/row'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {FilterFields} from 'common/filters'

export function SmokerFilterText(props: {
  is_smoker: boolean | null | undefined
  highlightedClass?: string
  mobile?: boolean
}) {
  const {is_smoker, highlightedClass, mobile} = props
  return (
    <Row className="items-center gap-0.5">
      <span className={clsx(highlightedClass, is_smoker != null && 'font-semibold')}>
        {is_smoker == null
          ? mobile ? 'Either' : 'Either'
          : is_smoker
            ? mobile ? 'Yes' : 'Smoker'
            : mobile ? 'No' : "Non-smoker"}
      </span>
    </Row>
  )
}

export function SmokerFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props

  const choicesMap = {
    Either: 'either',
    Yes: 'yes',
    No: 'no',
  } as const

  const currentChoice =
    filters.is_smoker == null ? choicesMap.Either : filters.is_smoker ? choicesMap.Yes : choicesMap.No

  return (
    <ChoicesToggleGroup
      currentChoice={currentChoice}
      choicesMap={choicesMap}
      setChoice={(c) => {
        if (c === choicesMap.Either) updateFilter({is_smoker: undefined})
        else if (c === choicesMap.Yes) updateFilter({is_smoker: true})
        else updateFilter({is_smoker: false})
      }}
      toggleClassName="w-1/3 justify-center"
    />
  )
}
