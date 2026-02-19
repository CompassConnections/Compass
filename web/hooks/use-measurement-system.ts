import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {getLocale} from "web/lib/locale-cookie";
import {MeasurementSystem} from "common/measurement-utils";

export const useMeasurementSystem = () => {
  // Get default based on locale
  const getDefaultMeasurementSystem = (): MeasurementSystem => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('measurement-system')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed === 'metric' || parsed === 'imperial') {
            return parsed
          }
        }
        // Default based on locale
        return getLocale() === 'en' ? 'imperial' : 'metric'
      } catch (e) {
        // Fallback to imperial if anything goes wrong
        return 'imperial'
      }
    }
    return 'imperial' // server-side default
  }

  const [measurementSystem, setMeasurementSystemState] =
    usePersistentLocalState<MeasurementSystem>(
      getDefaultMeasurementSystem(),
      'measurement-system'
    )

  const setMeasurementSystem = (newSystem: MeasurementSystem) => {
    setMeasurementSystemState(newSystem)
  }

  return {measurementSystem, setMeasurementSystem}
}
