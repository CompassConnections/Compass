import clsx from 'clsx'
import {EXERCISE_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {Col} from 'web/components/layout/col'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'

export function ExerciseFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_exercise', 'Exercise')}
      </span>
    )
  }

  if (length > 1) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          {t('filter.multiple', 'Multiple')}
        </span>
      </span>
    )
  }

  const option = options[0]
  const label = Object.entries(EXERCISE_CHOICES).find(([_, v]) => v === option)?.[0] || option

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {t(`profile.exercise.${option}`, label)}
      </span>
    </div>
  )
}

export function ExerciseFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <Col className="gap-4">
      <MultiCheckbox
        selected={filters.exercise ?? []}
        choices={EXERCISE_CHOICES as any}
        translationPrefix={'profile.exercise'}
        onChange={(c) => {
          updateFilter({exercise: c})
        }}
      />
    </Col>
  )
}
