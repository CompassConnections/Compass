import clsx from 'clsx'
import {convertLanguageTypes,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {LANGUAGE_CHOICES} from 'web/components/filters/choices'
import {FilterFields} from 'common/filters'
import {getSortedOptions} from 'common/util/sorting'
import {useT} from 'web/lib/locale'

export function LanguageFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_language', 'Any language')}
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

  const sortedOptions = getSortedOptions(options, LANGUAGE_CHOICES)
  const convertedTypes = sortedOptions.map((r) =>
    t(`profile.language.${r}`, convertLanguageTypes(r as any))
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

export function LanguageFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.languages ?? []}
      choices={LANGUAGE_CHOICES as any}
      translationPrefix={'profile.language'}
      onChange={(c) => {
        updateFilter({languages: c})
      }}
      optionsClassName={'w-[200px] sm:w-[400px]'}
    />
  )
}
