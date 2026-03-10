import {displayOptions, initialDisplayOptions} from 'common/profiles-rendering'
import {useEffect} from 'react'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'

export function useDisplayOptions(profile?: any) {
  const [displayOptions, setDisplayOptions] = usePersistentLocalState<displayOptions>(
    initialDisplayOptions,
    'rendering-options',
  )

  useEffect(() => {
    if (profile && displayOptions.showPhotos === undefined) {
      setDisplayOptions({showPhotos: !!profile?.pref_relation_styles?.includes('relationship')})
    }
  }, [profile])

  const updateDisplayOptions = (newState: Partial<displayOptions>) => {
    const updatedState = {...newState}
    setDisplayOptions((prevState) => ({...prevState, ...updatedState}))
  }
  return {displayOptions, updateDisplayOptions}
}
