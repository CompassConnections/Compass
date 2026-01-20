import clsx from 'clsx'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'
import {MultiCheckbox} from 'web/components/multi-checkbox'
import {FilterFields} from "common/filters";
import {OptionTableKey} from 'common/profiles/constants'
import {useT} from 'web/lib/locale'
import {toKey} from "common/parsing";

export function InterestFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  label: OptionTableKey
}) {
  const {options, highlightedClass, label} = props
  const t = useT()
  const length = (options ?? []).length

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
          text: options.map((o) => t(`profile.${label}.${toKey(o)}`, o)),
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
  choices: Record<string, string[]>
  label: OptionTableKey
}) {
  const {filters, updateFilter, choices, label} = props
  return (
    <MultiCheckbox
      selected={filters[label] ?? []}
      choices={choices as any}
      translationPrefix={`profile.${label}`}
      onChange={(c) => {
        updateFilter({[label]: c})
      }}
    />
  )
}
