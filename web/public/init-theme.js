// run this in <head> as blocking to prevent flash of unstyled content. See theme-provider.tsx
{
  // localStorage access throws a SecurityError when the browser denies site storage (cookies blocked,
  // embedded webviews). Read it through a guard so the page still renders with the defaults.
  const readStored = (key) => {
    try {
      return localStorage.getItem(key)
    } catch (_e) {
      return null
    }
  }

  const localTheme = readStored('theme')
  let theme = localTheme ? JSON.parse(localTheme) : 'auto'
  theme = theme.value ?? theme

  if (
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark')
  }

  const localFontPreference = readStored('font-preference')
  let fontPreference = localFontPreference ? JSON.parse(localFontPreference) : 'atkinson'
  fontPreference = fontPreference.value ?? fontPreference

  const fontFamilies = {
    atkinson: '"Atkinson Hyperlegible Next", Georgia, "Times New Roman", Times, serif',
    'system-sans':
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    'classic-serif': 'Georgia, "Times New Roman", Times, serif',
  }

  document.documentElement.style.setProperty(
    '--font-main',
    fontFamilies[fontPreference] ?? fontFamilies.atkinson,
  )
}
