'use client'
import {useEffect} from 'react'
import {usePersistentLocalState} from './use-persistent-local-state'
import {Capacitor} from '@capacitor/core'
import {StatusBar, Style} from '@capacitor/status-bar'

type theme_option = 'light' | 'dark' | 'auto'

export const useTheme = () => {
  const [themeState, setThemeState] = usePersistentLocalState<theme_option>('auto', 'theme')

  const setTheme = (theme: theme_option) => {
    setThemeState(theme)
    reRenderTheme()
  }

  return {theme: themeState, setTheme}
}

export const useThemeManager = () => {
  useEffect(() => {
    reRenderTheme()

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    darkQuery.addEventListener('change', reRenderTheme)
    return () => darkQuery.removeEventListener('change', reRenderTheme)
  }, [])
}

// NOTE: If you change anything about how this works, make sure init-theme.js is also changed.
// Here is how the theme works on a fresh load.
// 1. HTML is sent to the client. An inline <style> sets background & text based on system theme
// 2. A render-blocking <script> grabs the user preference out of localStorage, and sets "dark" class accordingly
// 3. Stuff is rendered. React hooks run. User can now change the theme.
//
// Without 1, there is a flash of light theme before the tailwind stylesheet loads.
// Without 2, there is a flash of light theme when tailwind stylesheet loads, before the react hooks run.
const reRenderTheme = () => {
  const theme: theme_option | null = getTheme()

  if (isDark(theme)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  updateStatusBar()
}

function getTheme() {
  return JSON.parse(localStorage.getItem('theme') ?? 'null') ?? 'auto'
}

function isDark(theme: theme_option | null) {
  return (
    theme === 'dark' ||
    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

export const updateStatusBar = async () => {
  // Update status bar on native platforms
  if (!Capacitor.isNativePlatform()) return
  try {
    const theme = getTheme()
    if (isDark(theme)) {
      // Dark theme: light text on dark background
      await StatusBar.setStyle({style: Style.Dark})
      await StatusBar.setBackgroundColor({color: '#141414'}) // dark bg color (canvas-0)
    } else {
      // Light theme: dark text on light background
      await StatusBar.setStyle({style: Style.Light})
      await StatusBar.setBackgroundColor({color: '#ffffff'}) // light bg color (canvas-0)
    }
  } catch (error) {
    console.error('Failed to update status bar:', error)
  }
}
