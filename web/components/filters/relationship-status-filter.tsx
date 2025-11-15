import clsx from 'clsx'
import {convertRelationshipStatusTypes,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {RELATIONSHIP_STATUS_CHOICES} from "web/components/filters/choices"
import {FilterFields} from "common/filters"
import {getSortedOptions} from "common/util/sorting"

export function RelationshipStatusFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  defaultLabel?: string
}) {
  const {options, highlightedClass, defaultLabel} = props
  const length = (options ?? []).length

  const label = defaultLabel || 'Any'

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>{label}</span>
    )
  }

  if (length > 2) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          Multiple
        </span>
      </span>
    )
  }

  const sortedOptions = getSortedOptions(options, RELATIONSHIP_STATUS_CHOICES)
  const convertedTypes = sortedOptions.map((r) => convertRelationshipStatusTypes(r as any))

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: convertedTypes,
          capitalizeFirstLetterOption: true,
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
      onChange={(c) => {
        updateFilter({relationship_status: c})
      }}
    />
  )
}
