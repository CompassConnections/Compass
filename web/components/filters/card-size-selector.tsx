import clsx from 'clsx'
import {CardSize, DisplayOptions} from 'common/profiles-rendering'
import {capitalize} from 'lodash'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

export function CardSizeSelector(props: {
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const {displayOptions, updateDisplayOptions} = props
  const t = useT()

  const sizes: Array<CardSize> = ['small', 'medium', 'large']

  return (
    <Col className="gap-2">
      <Row className="items-center">
        <span className="text-ink-600 text-sm">{t('filter.card_size', 'Card size')}</span>
      </Row>
      <Row className="gap-2 flex-wrap">
        {sizes.map((size) => {
          const isSelected = (displayOptions.cardSize ?? 'medium') === size
          return (
            <button
              key={size}
              className={clsx(
                'rounded-xl text-xs border-canvas-300 flex items-center gap-1.5 border px-3 py-2 text-ink-500 transition-colors hover:border-primary-400',
                isSelected ? 'bg-primary-200' : 'bg-canvas-100',
              )}
              onClick={() => updateDisplayOptions({cardSize: size})}
            >
              {t(`filter.card_size.${size}`, capitalize(size))}
            </button>
          )
        })}
      </Row>
    </Col>
  )
}
