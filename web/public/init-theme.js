// run this in <head> as blocking to prevent flash of unstyled content. See theme-provider.tsx
{
  const localTheme = localStorage.getItem('theme')
  const theme = localTheme ? JSON.parse(localTheme) : 'auto'

  if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }

  const localFontPreference = localStorage.getItem('font-preference')
  const defaultFont = window.__COMPASS_DEFAULT_FONT__ || 'atkinson'
  const fontPreference = localFontPreference ? JSON.parse(localFontPreference) : defaultFont
  const fontFamilies = window.__COMPASS_FONT_FAMILIES__ || {
    atkinson: '"Atkinson Hyperlegible Next", Georgia, "Times New Roman", Times, serif',
    'system-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    'classic-serif': 'Georgia, "Times New Roman", Times, serif',
  }

  document.documentElement.style.setProperty('--font-main', fontFamilies[fontPreference] ?? fontFamilies[defaultFont])
}
