import clsx from 'clsx'
import {DisplayOptions, GridLayout} from 'common/profiles-rendering'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function GridLayoutSelector(props: {
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const {displayOptions, updateDisplayOptions} = props
  const t = useT()

  const layouts: Array<{value: GridLayout; labelKey: string; fallbackLabel: string}> = [
    {value: 'masonry', labelKey: 'filter.grid_layout.masonry', fallbackLabel: 'Fitted'},
    {value: 'uniform', labelKey: 'filter.grid_layout.uniform', fallbackLabel: 'Equal tiles'},
  ]

  return (
    <Col className="gap-2">
      <Row className="items-center">
        <span className="text-ink-600 text-sm">{t('filter.grid_layout', 'Grid layout')}</span>
      </Row>
      <Row className="gap-2 flex-wrap">
        {layouts.map((layout) => {
          const isSelected = (displayOptions.gridLayout ?? 'masonry') === layout.value
          return (
            <button
              key={layout.value}
              className={clsx(
                'rounded-xl text-xs border-canvas-300 flex items-center gap-1.5 border px-3 py-2 text-ink-500 transition-colors hover:border-primary-400',
                isSelected ? 'bg-primary-200' : 'bg-canvas-100',
              )}
              onClick={() => updateDisplayOptions({gridLayout: layout.value})}
            >
              {t(layout.labelKey, layout.fallbackLabel)}
            </button>
          )
        })}
      </Row>
    </Col>
  )
}
