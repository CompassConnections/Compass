import {useEffect} from 'react'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {DEFAULT_FONT_PREFERENCE, FontOption, FONT_FAMILIES} from 'web/lib/font-preference'

export const useFontPreference = () => {
  const [font, setFontState] = usePersistentLocalState<FontOption>(DEFAULT_FONT_PREFERENCE, 'font-preference')

  const setFont = (newFont: FontOption) => {
    setFontState(newFont)
    applyFontPreference(newFont)
  }

  return {font, setFont}
}

export const useFontPreferenceManager = () => {
  useEffect(() => {
    applyFontPreference(getStoredFontPreference())
  }, [])
}

export const applyFontPreference = (font: FontOption) => {
  const fontFamily = FONT_FAMILIES[font] ?? FONT_FAMILIES[DEFAULT_FONT_PREFERENCE]
  document.documentElement.style.setProperty('--font-main', fontFamily)
}

const getStoredFontPreference = (): FontOption => {
  if (typeof window === 'undefined') return DEFAULT_FONT_PREFERENCE
  return JSON.parse(localStorage.getItem('font-preference') ?? 'null') ?? DEFAULT_FONT_PREFERENCE
}
