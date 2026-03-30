import clsx from 'clsx'
import {PSYCHEDELICS_CHOICES, SUBSTANCE_INTENTION_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {Col} from 'web/components/layout/col'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'

export function PsychedelicsFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_psychedelics', 'Any psychedelics')}
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
  const label = Object.entries(PSYCHEDELICS_CHOICES).find(([_, v]) => v === option)?.[0] || option

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {t(`profile.psychedelics.${option}`, label)}
      </span>
    </div>
  )
}

export function PsychedelicsFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  const t = useT()
  return (
    <Col className="gap-4">
      <MultiCheckbox
        selected={filters.psychedelics ?? []}
        choices={PSYCHEDELICS_CHOICES as any}
        translationPrefix={'profile.psychedelics'}
        onChange={(c) => {
          updateFilter({psychedelics: c})
        }}
      />
      {filters.psychedelics &&
        filters.psychedelics.length > 0 &&
        !filters.psychedelics.includes('never_not_interested') && (
          <Col className="gap-2">
            <label className="text-sm text-ink-600">
              {t('profile.optional.intention', 'Intention')}
            </label>
            <MultiCheckbox
              selected={filters.psychedelics_intention ?? []}
              choices={SUBSTANCE_INTENTION_CHOICES as any}
              translationPrefix={'profile.substance_intention'}
              onChange={(c) => {
                updateFilter({psychedelics_intention: c})
              }}
            />
          </Col>
        )}
    </Col>
  )
}
