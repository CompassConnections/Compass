import clsx from 'clsx'
import {MBTI_CHOICES} from 'web/components/filters/choices'
import {FilterFields} from 'common/filters'
import {getSortedOptions} from 'common/util/sorting'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {useT} from 'web/lib/locale'

export function MbtiFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  defaultLabel?: string
}) {
  const {options, highlightedClass, defaultLabel} = props
  const t = useT()
  const length = (options ?? []).length

  const label = defaultLabel || t('filter.any', 'Any')

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>{label}</span>
    )
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

  const sortedOptions = getSortedOptions(options, MBTI_CHOICES)
  const displayTypes = sortedOptions.map((type) => type.toUpperCase())

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: displayTypes,
          capitalizeFirstLetterOption: false,
          t: t,
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
      optionsClassName={'grid grid-cols-2 xs:grid-cols-4'}
      selected={filters.mbti ?? []}
      choices={MBTI_CHOICES as any}
      translationPrefix={'profile.mbti'}
      onChange={(c) => {
        updateFilter({mbti: c})
      }}
    />
  )
}
