import {COMPATIBILITY_MIN_CHOICES, FilterFields} from 'common/filters'
import {DropdownOptions} from 'web/components/comments/dropdown-menu'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

const DEFAULT_KEY = 'any'

/**
 * The one filter that reads the score rather than the profile: keep only the people whose stored
 * compatibility with you is at least this much. Its real job is the saved search behind an email
 * alert, which otherwise can only say "woman, 30 to 40, within 50 km" and fires on everyone who
 * clears those few dealbreakers.
 */
export function CompatibilityFilterText(props: {
  compatibility_min: number | undefined | null
  highlightedClass?: string
}) {
  const {compatibility_min, highlightedClass} = props
  const t = useT()
  return (
    <Row className="items-center gap-0.5">
      <span className={highlightedClass}>
        {compatibility_min
          ? t('filter.compatibility.at_least', 'At least {value}%', {
              value: String(compatibility_min),
            })
          : t('filter.compatibility.title', 'Compatibility')}
      </span>
    </Row>
  )
}

export function CompatibilityFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  close?: () => void
}) {
  const {filters, updateFilter, close} = props
  const t = useT()

  const items: Record<string, string> = {
    [DEFAULT_KEY]: t('filter.compatibility.any', 'Any'),
    ...Object.fromEntries(
      COMPATIBILITY_MIN_CHOICES.map((value) => [
        String(value),
        t('filter.compatibility.at_least', 'At least {value}%', {value: String(value)}),
      ]),
    ),
  }

  return (
    <DropdownOptions
      items={items}
      activeKey={filters.compatibility_min ? String(filters.compatibility_min) : DEFAULT_KEY}
      onClick={(key) => {
        updateFilter({compatibility_min: key === DEFAULT_KEY ? undefined : Number(key)})
        close?.()
      }}
    />
  )
}
