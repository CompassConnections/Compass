import clsx from 'clsx'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {FilterFields} from "common/filters";
import {EDUCATION_CHOICES} from "web/components/filters/choices";
import {convertEducationTypes} from "web/lib/util/convert-types";
import stringOrStringArrayToText from "web/lib/util/string-or-string-array-to-text";
import {MAX_INT} from "common/constants";

export function EducationFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any education</span>
    )
  }

  const order = Object.values(EDUCATION_CHOICES)
  const sortedOptions = options
    .slice()
    .sort((a, b) => {
      const ia = order.indexOf(a as any)
      const ib = order.indexOf(b as any)
      const sa = ia === -1 ? MAX_INT : ia
      const sb = ib === -1 ? MAX_INT : ib
      if (sa !== sb) return sa - sb
      return String(a).localeCompare(String(b))
    })

  const convertedTypes = sortedOptions.map((r) => convertEducationTypes(r as any))
  
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

export function EducationFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <>
      <MultiCheckbox
        selected={filters.education_levels ?? []}
        choices={EDUCATION_CHOICES}
        onChange={(c) => {
          updateFilter({education_levels: c})
        }}
      />
    </>
  )
}
