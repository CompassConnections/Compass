// run this in <head> as blocking to prevent flash of unstyled content. See theme-provider.tsx
{
  const localTheme = localStorage.getItem('theme')
  const theme = localTheme ? JSON.parse(localTheme) : 'auto'

  if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
}
