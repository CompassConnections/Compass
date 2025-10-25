import clsx from 'clsx'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {FilterFields} from "common/filters";
import {RELIGION_CHOICES} from "web/components/filters/choices";
import {convertReligionTypes} from "web/lib/util/convert-types";
import stringOrStringArrayToText from "web/lib/util/string-or-string-array-to-text";
import {getSortedOptions} from "common/util/sorting";


export function ReligionFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any religion</span>
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

  const sortedOptions = getSortedOptions(options, RELIGION_CHOICES)
  const convertedTypes = sortedOptions.map((r) => convertReligionTypes(r as any))

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

export function ReligionFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <>
      <MultiCheckbox
        selected={filters.religion ?? []}
        choices={RELIGION_CHOICES}
        onChange={(c) => {
          updateFilter({religion: c})
        }}
      />
    </>
  )
}
