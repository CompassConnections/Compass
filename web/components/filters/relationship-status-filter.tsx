import clsx from 'clsx'
import {RELATIONSHIP_STATUS_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {getSortedOptions} from 'common/util/sorting'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'
import {convertRelationshipStatusTypes} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function RelationshipStatusFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  defaultLabel?: string
}) {
  const {options, highlightedClass, defaultLabel} = props
  const t = useT()
  const length = (options ?? []).length

  const label = defaultLabel || t('filter.any', 'Any')

  if (!options || length < 1) {
    return <span className={clsx('text-semibold', highlightedClass)}>{label}</span>
  }

  if (length > 2) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          {t('filter.multiple', 'Multiple')}
        </span>
      </span>
    )
  }

  const sortedOptions = getSortedOptions(options, RELATIONSHIP_STATUS_CHOICES)
  const convertedTypes = sortedOptions.map((r) =>
    t(`profile.relationship_status.${r}`, convertRelationshipStatusTypes(r)),
  )

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: convertedTypes,
          capitalizeFirstLetterOption: true,
          t: t,
        })}{' '}
      </span>
    </div>
  )
}

export function RelationshipStatusFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.relationship_status ?? []}
      choices={RELATIONSHIP_STATUS_CHOICES as any}
      translationPrefix={'profile.relationship_status'}
      onChange={(c) => {
        updateFilter({relationship_status: c})
      }}
    />
  )
}
