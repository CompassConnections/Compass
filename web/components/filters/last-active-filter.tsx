import clsx from 'clsx'
import {LAST_ONLINE_CHOICES} from 'common/choices'
import {FilterFields} from 'common/filters'
import {toKey} from 'common/parsing'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

import {Col} from '../layout/col'

const DEFAULT_KEY = 'any'

export function LastActiveFilterText(props: {
  last_active: string | undefined
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
      onClick={(option) => {
        updateFilter({last_active: option === DEFAULT_KEY ? undefined : option})
        close?.()
      }}
    />
  )
}

export function DropdownOptions(props: {
  items: Record<string, any>
  onClick: (item: any) => void
  activeKey: string
  translationPrefix?: string
}) {
  const {items, onClick, activeKey, translationPrefix} = props

  const t = useT()

  const translateOption = (key: string, value: string) => {
    if (!translationPrefix) return value
    return t(`${translationPrefix}.${toKey(key)}`, value)
  }

  return (
    <Col className={'w-[150px]'}>
      {Object.entries(items).map(([key, item]) => (
        <div key={key}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onClick(key)
            }}
            className={clsx(
              key == activeKey ? 'bg-primary-100' : 'hover:bg-canvas-100 hover:text-ink-900',
              'text-ink-700',
              'flex w-full gap-2 px-4 py-2 text-left text-sm rounded-md',
            )}
          >
            {item.icon && <div className="w-5">{item.icon}</div>}
            {translateOption(key, item.label ?? item)}
          </button>
        </div>
      ))}
    </Col>
  )
}
