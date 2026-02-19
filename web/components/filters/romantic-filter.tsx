import clsx from 'clsx'
import {convertRomanticTypes, RomanticType} from 'web/lib/util/convert-types'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'

import {ROMANTIC_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {useT} from 'web/lib/locale'
import {toKey} from 'common/parsing'

export function RomanticFilterText(props: {
  relationship: RomanticType[] | undefined
  highlightedClass?: string
}) {
  const {relationship, highlightedClass} = props
  const t = useT()
  const length = (relationship ?? []).length

  if (!relationship || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t('filter.any_relationship', 'Any relationship')}
      </span>
    )
  }

  const convertedTypes = relationship.map((r) =>
    t(`profile.romantic.${toKey(r)}`, convertRomanticTypes(r)),
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

export function RomanticFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
}) {
  const {filters, updateFilter} = props
  return (
    <MultiCheckbox
      selected={filters.pref_romantic_styles ?? []}
      choices={ROMANTIC_CHOICES as any}
      translationPrefix={'profile.romantic'}
      onChange={(c) => {
        updateFilter({pref_romantic_styles: c})
      }}
    />
  )
}
