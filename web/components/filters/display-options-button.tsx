import {Squares2X2Icon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {DisplayOptions} from 'common/profiles-rendering'
import {buttonClass} from 'web/components/buttons/button'
import {CardSizeSelector} from 'web/components/filters/card-size-selector'
import {FieldToggles} from 'web/components/filters/field-toggles'
import {GridLayoutSelector} from 'web/components/filters/grid-layout-selector'
import {Col} from 'web/components/layout/col'
import {CustomizeableDropdown} from 'web/components/widgets/customizeable-dropdown'
import {useT} from 'web/lib/locale'

// Display options are view preferences, not filters — they change how the grid is drawn, never who
// is in it. They live here in the toolbar rather than inside the filters panel so they stay
// reachable whether or not that panel is open.
export function DisplayOptionsButton(props: {
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
  className?: string
}) {
  const {displayOptions, updateDisplayOptions, className} = props
  const t = useT()

  return (
    <CustomizeableDropdown
      className={className}
      menuWidth="w-64"
      popoverClassName="!px-4 !py-4"
      // Same buttonClass()/overrides as the Filters button beside it, so the two siblings match in
      // font, size and colour rather than drifting apart.
      buttonClass={clsx(
        buttonClass('sm', 'gray-white'),
        '!h-10 !rounded-full border border-canvas-200',
      )}
      buttonContent={() => (
        <>
          <Squares2X2Icon className="h-4 w-4 sm:mr-1.5" />
          {/* sr-only rather than `hidden` below sm: the label must stay in the accessibility tree
              (and reachable by name in tests) even when it isn't drawn. */}
          <span className="sr-only sm:not-sr-only">{t('search.display', 'Display')}</span>
        </>
      )}
      dropdownMenuContent={
        <Col className="gap-4">
          <CardSizeSelector
            displayOptions={displayOptions}
            updateDisplayOptions={updateDisplayOptions}
          />
          <GridLayoutSelector
            displayOptions={displayOptions}
            updateDisplayOptions={updateDisplayOptions}
          />
          <Col className="gap-2">
            <span className="text-ink-600 text-sm">{t('filter.show_fields', 'Show on cards')}</span>
            <FieldToggles
              displayOptions={displayOptions}
              updateDisplayOptions={updateDisplayOptions}
            />
          </Col>
        </Col>
      }
    />
  )
}
