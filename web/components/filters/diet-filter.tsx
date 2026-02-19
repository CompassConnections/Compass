import clsx from 'clsx'
import {convertDietTypes, DietType,} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {DIET_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {useT} from 'web/lib/locale'

export function DietFilterText(props: {
  options: DietType[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_diet', 'Any diet')}
      </span>
    )
  }

  const convertedTypes = options.map((r) =>
    convertDietTypes(r)
  )

  if (length > 1) {
    return (
      <span>
        <span className={clsx('font-semibold', highlightedClass)}>
          {t('filter.multiple', 'Multiple')}
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
          t: t,
        })}{' '}
      </span>
    </div>
  )
}

export function DietFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.diet ?? []}
      choices={DIET_CHOICES as any}
      translationPrefix={'profile.diet'}
      onChange={(c) => {
        updateFilter({diet: c})
      }}
    />
  )
}
