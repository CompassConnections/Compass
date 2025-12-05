import clsx from 'clsx'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {FilterFields} from "common/filters";
import {OptionTableKey} from "common/profiles/constants";

export function InterestFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  label: string
}) {
  const {options, highlightedClass, label} = props
  const length = (options ?? []).length

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any {label}</span>
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

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: options,
          capitalizeFirstLetterOption: true,
        })}{' '}
      </span>
    </div>
  )
}

export function InterestFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  choices: Record<string, string[]>
  label: OptionTableKey
}) {
  const {filters, updateFilter, choices, label} = props
  return (
    <MultiCheckbox
      selected={filters[label] ?? []}
      choices={choices as any}
      onChange={(c) => {
        updateFilter({[label]: c})
      }}
    />
  )
}
