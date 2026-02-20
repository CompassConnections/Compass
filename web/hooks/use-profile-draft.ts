import {useCallback, useEffect, useState} from 'react'
import {ProfileWithoutUser} from 'common/profiles/profile'

const safeLocalStorage = typeof window !== 'undefined' ? window.localStorage : null

export const useProfileDraft = (
  userId: string,
  profile: ProfileWithoutUser,
  setProfile: <K extends keyof ProfileWithoutUser>(key: K, value: ProfileWithoutUser[K]) => void,
  updateHeight?: (value: number | undefined) => void,
) => {
  const KEY = `draft-profile-${userId}`
  const [draftLoaded, setDraftLoaded] = useState(false)

  const clearProfileDraft = (userId: string) => {
    try {
      safeLocalStorage?.removeItem(`draft-profile-${userId}`)
    } catch (error) {
      console.warn('Failed to clear profile from store:', error)
    }
  }

  // Debounced save function
  const debouncedSaveProfile = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (profileToSave: ProfileWithoutUser) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          try {
            safeLocalStorage?.setItem(
              KEY,
              JSON.stringify({
                profile: profileToSave,
                timestamp: Date.now().toString(),
              }),
            )
          } catch (error) {
            console.warn('Failed to save profile to store:', error)
          }
        }, 500) // 500ms debounce delay
      }
    })(),
    [KEY],
  )

  useEffect(() => {
    console.log({profile})
    if (profile && Object.keys(profile).length > 0) {
      debouncedSaveProfile(profile)
    }
  }, [profile, userId, debouncedSaveProfile])

  useEffect(() => {
    try {
      const savedProfileString = safeLocalStorage?.getItem(KEY)
      if (savedProfileString) {
        const data = JSON.parse(savedProfileString)
        if (data) {
          const {profile: savedProfile, timestamp} = data
          // Check if saved data is older than 24 hours
          if (timestamp) {
            const savedTime = parseInt(timestamp, 10)
            const now = Date.now()
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000

            if (now - savedTime > twentyFourHoursInMs) {
              console.log('Skipping profile update: saved data is older than 24 hours')
              return
            }
          }

          // Update all profile fields
          Object.entries(savedProfile).forEach(([key, value]) => {
            const typedKey = key as keyof ProfileWithoutUser
            if (value !== profile[typedKey]) {
              console.log(key, value)
              setProfile(typedKey, value)
              if (typedKey === 'height_in_inches' && updateHeight) {
                updateHeight(value as number)
              }
            }
          })
          setDraftLoaded(true)
        }
      }
    } catch (error) {
      console.warn('Failed to load profile from store:', error)
    }
  }, []) // Only run once on mount

  return {clearProfileDraft, draftLoaded}
}
