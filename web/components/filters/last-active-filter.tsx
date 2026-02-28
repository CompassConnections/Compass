import {LAST_ONLINE_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {DropdownOptions} from 'web/components/comments/dropdown-menu'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

const DEFAULT_KEY = 'any'

export function LastActiveFilterText(props: {
  last_active: string | undefined | null
  highlightedClass?: string
}) {
  const {last_active, highlightedClass} = props
  const t = useT()
  const key =
    (Object.keys(LAST_ONLINE_CHOICES) as Array<keyof typeof LAST_ONLINE_CHOICES>).find(
      (opt) => opt === last_active,
    ) ?? DEFAULT_KEY
  const label = t(`filter.last_active.${key}`, LAST_ONLINE_CHOICES[key])
  return (
    <Row className="items-center gap-0.5">
      <span className={highlightedClass}>
        {t('filter.last_active.label', 'Active')}: {label}
      </span>
    </Row>
  )
}

export function LastActiveFilter(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  close?: () => void
}) {
  const {filters, updateFilter, close} = props

  return (
    <DropdownOptions
      items={LAST_ONLINE_CHOICES}
      activeKey={filters.last_active || DEFAULT_KEY}
      translationPrefix={'filter.last_active'}
      onClick={(key) => {
        updateFilter({last_active: key === DEFAULT_KEY ? undefined : key})
        close?.()
      }}
    />
  )
}
