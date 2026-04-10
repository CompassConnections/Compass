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
                'px-3 py-1.5 text-sm rounded-xl border border-canvas-100 transition-colors',
                isSelected ? 'bg-primary-100' : 'bg-canvas-0  hover:bg-canvas-25',
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
