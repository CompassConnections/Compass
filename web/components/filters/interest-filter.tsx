import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {OptionTableKey} from 'common/profiles/constants'
import {invert} from 'lodash'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {useChoices} from 'web/hooks/use-choices'
import {useLocale, useT} from 'web/lib/locale'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function InterestFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  label: OptionTableKey
}) {
  const {options, highlightedClass, label} = props
  const t = useT()
  const length = (options ?? []).length
  const {choices} = useChoices(label)

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t(`filter.any_${label}`, `Any ${label}`)}
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

  return (
    <div>
      <span className={clsx('font-semibold', highlightedClass)}>
        {stringOrStringArrayToText({
          text: options.map((id) => choices[id]),
          capitalizeFirstLetterOption: true,
          t: t,
        })}{' '}
      </span>
    </div>
  )
}

export function InterestFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  choices: Record<string, string>
  label: OptionTableKey
}) {
  const {filters, updateFilter, choices, label} = props
  const {locale} = useLocale()
  const sortedChoices = Object.fromEntries(
    Object.entries(invert(choices)).sort((a, b) => a[0].localeCompare(b[0], locale)),
  )
  return (
    <MultiCheckbox
      selected={filters[label] ?? []}
      choices={sortedChoices as any}
      onChange={(c) => updateFilter({[label]: c})}
      optionsClassName={'w-[200px] sm:w-[400px]'}
    />
  )
}
