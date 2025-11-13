import clsx from 'clsx'
import {MBTI_CHOICES} from 'web/components/filters/choices'
import {FilterFields} from 'common/filters'
import {getSortedOptions} from 'common/util/sorting'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function MbtiFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>Any MBTI</span>
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

  const sortedOptions = getSortedOptions(options, MBTI_CHOICES)
  const displayTypes = sortedOptions.map((type) => type.toUpperCase())

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: displayTypes,
          capitalizeFirstLetterOption: false,
        })}{' '}
      </span>
    </div>
  )
}

export function MbtiFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props

  return (
    <MultiCheckbox
      className={'grid grid-cols-2 xs:grid-cols-4'}
      selected={filters.mbti ?? []}
      choices={MBTI_CHOICES as any}
      onChange={(c) => {
        updateFilter({mbti: c})
      }}
    />
  )
}
