import {Switch} from '@headlessui/react'
import {useT} from 'web/lib/locale'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import clsx from 'clsx'
import {Row} from 'web/components/layout/row'

export default function MeasurementSystemToggle(props: { className?: string }) {
  const {className} = props
  const {measurementSystem, setMeasurementSystem} = useMeasurementSystem()
  const t = useT()

  const isEnabled = measurementSystem === 'metric'

  return (
    <Row className={clsx('items-center gap-2', className)}>
      <span
        className={clsx('text-sm', !isEnabled ? 'font-bold' : 'text-ink-500')}
      >
        {t('settings.measurement.imperial', 'Imperial')}
      </span>

      <Switch
        checked={isEnabled}
        onChange={(enabled: boolean) =>
          setMeasurementSystem(enabled ? 'metric' : 'imperial')
        }
        className={clsx(
          isEnabled ? 'bg-primary-500' : 'bg-ink-300',
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none'
        )}
      >
        <span
          className={clsx(
            isEnabled ? 'translate-x-6' : 'translate-x-1',
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
          )}
        />
      </Switch>

      <span
        className={clsx('text-sm', isEnabled ? 'font-bold' : 'text-ink-500')}
      >
        {t('settings.measurement.metric', 'Metric')}
      </span>
    </Row>
  )
}
