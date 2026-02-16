import {useEffect} from 'react'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'

export type FontOption = 'atkinson' | 'system-sans' | 'classic-serif'

const FONT_VARIABLES: Record<FontOption, string> = {
  atkinson: '"Atkinson Hyperlegible Next", Georgia, "Times New Roman", Times, serif',
  'system-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  'classic-serif': 'Georgia, "Times New Roman", Times, serif',
}

export const useFontPreference = () => {
  const [font, setFontState] = usePersistentLocalState<FontOption>('atkinson', 'font-preference')

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
  const fontFamily = FONT_VARIABLES[font] ?? FONT_VARIABLES.atkinson
  document.documentElement.style.setProperty('--font-main', fontFamily)
}

const getStoredFontPreference = (): FontOption => {
  if (typeof window === 'undefined') return 'atkinson'
  return JSON.parse(localStorage.getItem('font-preference') ?? 'null') ?? 'atkinson'
}
