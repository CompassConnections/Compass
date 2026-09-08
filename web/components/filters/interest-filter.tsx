import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {OptionTableKey} from 'common/profiles/constants'
import {OptionPicker} from 'web/components/option-picker'
import {useChoicesContext} from 'web/hooks/use-choices'
import {useT} from 'web/lib/locale'
import stringOrStringArrayToText from 'web/lib/util/string-or-string-array-to-text'

export function InterestFilterText(props: {
  options: string[] | undefined
  highlightedClass?: string
  label: OptionTableKey
}) {
  const {options, highlightedClass, label} = props
  const t = useT()
  const length = (options ?? []).length
  const choices = useChoicesContext()?.[label]

  if (!options || length < 1) {
    return (
      <span className={clsx('text-semibold', highlightedClass)}>
        {t(`filter.any_${label}`, `${label.charAt(0).toUpperCase()}${label.slice(1)}`)}
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

/**
 * Interests / causes / work in the filter rail.
 *
 * Searchable, and deliberately **not** creatable. Those two used to be the same switch: the text
 * field in `MultiCheckbox` only rendered when an `addOption` callback was passed, and this component
 * cannot pass one — creating an option that by definition no profile holds and then filtering by it
 * returns an empty result set, and writes a permanent row into the shared taxonomy from a context
 * where the reader is describing someone else, not themselves. So the rail got no search box at all
 * and became an alphabetical wall of every option ever created.
 *
 * That also makes this a prerequisite rather than a nicety: once the default view is a short
 * popularity-ranked page, a rail with no search box could only ever reach the most common options
 * and every long-tail interest would become unfilterable.
 */
export function InterestFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  label: OptionTableKey
}) {
  const {filters, updateFilter, label} = props
  return (
    <OptionPicker
      label={label}
      selected={filters[label] ?? []}
      onChange={(c) => updateFilter({[label]: c})}
      optionsClassName={''}
    />
  )
}
