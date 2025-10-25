import clsx from 'clsx'
import {convertPoliticalTypes,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {POLITICAL_CHOICES} from "web/components/filters/choices";
import {FilterFields} from "common/filters";
import {getSortedOptions} from "common/util/sorting";

export function PoliticalFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any politics</span>
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

  const sortedOptions = getSortedOptions(options, POLITICAL_CHOICES)
  const convertedTypes = sortedOptions.map((r) => convertPoliticalTypes(r as any))

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

export function PoliticalFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.political_beliefs ?? []}
      choices={POLITICAL_CHOICES as any}
      onChange={(c) => {
        updateFilter({political_beliefs: c})
      }}
    />
  )
}
