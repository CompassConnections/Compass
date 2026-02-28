// run this in <head> as blocking to prevent flash of unstyled content. See theme-provider.tsx
{
  const localTheme = localStorage.getItem('theme')
  let theme = localTheme ? JSON.parse(localTheme) : 'auto'
  theme = theme.value ?? theme

  if (
    theme === 'dark' ||
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark')
  }

  const localFontPreference = localStorage.getItem('font-preference')
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
