import clsx from 'clsx'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {FilterFields} from 'common/filters'
import {RELIGION_CHOICES} from 'common/choices'
import {convertReligionTypes} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {getSortedOptions} from 'common/util/sorting'
import {useT} from 'web/lib/locale'
import {toKey} from 'common/parsing'

export function ReligionFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_religion', 'Any religion')}
      </span>
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

  const sortedOptions = getSortedOptions(options, RELIGION_CHOICES)
  const convertedTypes = sortedOptions.map((r) =>
    t(`profile.religion.${toKey(r)}`, convertReligionTypes(r as any)),
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

export function ReligionFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  className?: string
}) {
  const {filters, updateFilter, className} = props
  return (
    <>
      <MultiCheckbox
        selected={filters.religion ?? []}
        choices={RELIGION_CHOICES}
        translationPrefix={'profile.religion'}
        onChange={(c) => {
          updateFilter({religion: c})
        }}
        optionsClassName={className}
      />
    </>
  )
}
