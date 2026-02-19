import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {Row} from 'web/components/layout/row'
import {ChoicesToggleGroup} from 'web/components/widgets/choices-toggle-group'
import {useT} from 'web/lib/locale'

export function SmokerFilterText(props: {
  is_smoker: boolean | null | undefined
  highlightedClass?: string
  mobile?: boolean
}) {
  const {is_smoker, highlightedClass, mobile} = props
  const t = useT()
  return (
    <Row className="items-center gap-0.5">
      <span className={clsx(highlightedClass, is_smoker != null && 'font-semibold')}>
        {is_smoker == null
          ? t('common.either', 'Either')
          : is_smoker
            ? mobile
              ? t('common.yes', 'Yes')
              : t('profile.smoker.yes', 'Smoker')
            : mobile
              ? t('common.no', 'No')
              : t('profile.smoker.no', 'Non-smoker')}
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

  const currentChoice = filters.is_smoker == null ? 'either' : filters.is_smoker ? 'yes' : 'no'

  return (
    <ChoicesToggleGroup
      currentChoice={currentChoice}
      choicesMap={choicesMap}
      translationPrefix={'profile.smoker'}
      setChoice={(c) => {
        if (c === 'either') updateFilter({is_smoker: undefined})
        else if (c === 'yes') updateFilter({is_smoker: true})
        else updateFilter({is_smoker: false})
      }}
      toggleClassName="w-1/3 justify-center"
    />
  )
}
