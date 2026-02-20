import {MoonIcon, SunIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {Row} from 'web/components/layout/row'
import {useTheme} from 'web/hooks/use-theme'
import {useT} from 'web/lib/locale'

export default function ThemeIcon(props: {className?: string}) {
  const {className} = props
  const {theme, setTheme} = useTheme()
  const t = useT()

  const toggleTheme = () => {
    setTheme(theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto')
  }
  const children =
    theme === 'light' ? (
      t('theme.light', 'Light')
    ) : theme === 'dark' ? (
      t('theme.dark', 'Dark')
    ) : (
      <>
        <span className="hidden dark:inline">{t('theme.dark', 'Dark')}</span>
        <span className="inline dark:hidden">{t('theme.light', 'Light')}</span> (
        {t('theme.auto', 'auto')})
      </>
    )
  const icon = (
    <>
      <MoonIcon className={clsx(className, 'hidden dark:block')} />
      <SunIcon className={clsx(className, 'block dark:hidden')} />
    </>
  )
  return (
    <button onClick={toggleTheme}>
      <Row className="items-center gap-1 border-2 border-gray-500 rounded-full p-1 max-w-fit mx-2 px-3 hover:bg-canvas-100">
        {icon}
        {children}
      </Row>
    </button>
  )
}
