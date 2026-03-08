import {initialRenderingOptions, RenderingOptions} from 'common/profiles-rendering'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'

export function useRenderingOptions() {
  const [renderingOptions, setRenderingOptions] = usePersistentLocalState<RenderingOptions>(
    initialRenderingOptions,
    'rendering-options',
  )

  const updateRenderingOptions = (newState: Partial<RenderingOptions>) => {
    const updatedState = {...newState}
    setRenderingOptions((prevState) => ({...prevState, ...updatedState}))
  }
  return {renderingOptions, updateRenderingOptions}
}
