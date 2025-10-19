import clsx from 'clsx'
import {convertRomanticTypes, RomanticType,} from 'web/lib/util/convert-relationship-type'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {ROMANTIC_CHOICES} from "web/components/filters/choices";
import {FilterFields} from "common/filters";

export function RomanticFilterText(props: {
  relationship: RomanticType[] | undefined
  highlightedClass?: string
}) {
  const {relationship, highlightedClass} = props
  const length = (relationship ?? []).length

  if (!relationship || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any relationship</span>
    )
  }

  const convertedTypes = relationship.map((r) =>
    convertRomanticTypes(r)
  )

  if (length > 1) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          Multiple
        </span>
      </span>
    )
  }
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

export function RomanticFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.pref_romantic_styles ?? []}
      choices={ROMANTIC_CHOICES as any}
      onChange={(c) => {
        updateFilter({pref_romantic_styles: c})
      }}
    />
  )
}
