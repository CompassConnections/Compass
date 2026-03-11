import {DisplayOptions, initialDisplayOptions} from 'common/profiles-rendering'
import {useEffect} from 'react'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'

export function useDisplayOptions(profile?: any) {
  const [displayOptions, setDisplayOptions] = usePersistentLocalState<DisplayOptions>(
    initialDisplayOptions,
    'rendering-options',
  )

  const updateDisplayOptions = (newState: Partial<DisplayOptions>) => {
    const updatedState = {...newState}
    setDisplayOptions((prevState) => ({...prevState, ...updatedState}))
  }

  useEffect(() => {
    if (profile && displayOptions.showPhotos === undefined) {
      const isLookingForRelationship = !!profile?.pref_relation_styles?.includes('relationship')
      updateDisplayOptions({
        showPhotos: isLookingForRelationship,
        showAge: isLookingForRelationship,
        showGender: isLookingForRelationship,
      })
    }
  }, [profile])

  return {displayOptions, updateDisplayOptions}
}
