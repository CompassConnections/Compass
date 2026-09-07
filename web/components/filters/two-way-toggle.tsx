import {CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

/**
 * Turns the search from one-sided into mutual: on top of everything the member has asked for, a
 * profile also has to accept *them* on the fields where two answers can actually conflict — gender,
 * age, distance, connection type and kid desire.
 *
 * Shaped like `LookingForToggle` (full-width, rectangular, not a chip) because it sits beside it and
 * the two are the same kind of thing. Unlike that one it is real state rather than an action, so it
 * keeps its subtitle: "hides profiles" is a consequence worth stating before it is switched on.
 */
export function TwoWayToggle(props: {
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  hidden: boolean
}) {
  const {filters, updateFilter, hidden} = props
  const t = useT()
  if (hidden) return <></>

  const checked = !!filters.twoWay

  return (
    <Row className="w-full">
      <label
        className={clsx(
          'group relative flex w-full cursor-pointer select-none items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-150',
          'focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-1 focus-within:ring-offset-canvas-50',
          checked
            ? 'border-cta bg-cta/10 text-cta'
            : 'border-canvas-300 bg-canvas-0 text-ink-600 hover:border-primary-400 hover:text-primary-700',
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => updateFilter({twoWay: checked ? undefined : true})}
          data-testid="two-way-toggle"
        />
        <Col className="gap-0.5">
          <span className="font-medium">{t('filter.two_way.title', 'Two-way search')}</span>
          <span className={clsx('text-xs', checked ? 'text-cta/80' : 'text-ink-400')}>
            {t(
              'filter.two_way.description',
              'Only show people who are looking for someone like you',
            )}
          </span>
        </Col>
        {checked && <CheckIcon className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
      </label>
    </Row>
  )
}
