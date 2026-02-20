import clsx from 'clsx'
import {EDUCATION_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {toKey} from 'common/parsing'
import {getSortedOptions} from 'common/util/sorting'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useT} from 'web/lib/locale'
import {convertEducationTypes} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function EducationFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
}) {
  const {options, highlightedClass} = props
  const length = (options ?? []).length

  const t = useT()

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_education', 'Any education')}
      </span>
    )
  }

  const sortedOptions = getSortedOptions(options, EDUCATION_CHOICES)
  const convertedTypes = sortedOptions.map((r) =>
    t(`profile.education.${toKey(r)}`, convertEducationTypes(r as any)),
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
        translationPrefix={'profile.education'}
        onChange={(c) => {
          updateFilter({education_levels: c})
        }}
      />
    </>
  )
}
