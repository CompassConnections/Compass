import {MoonIcon, SunIcon} from "@heroicons/react/outline"
import clsx from "clsx"
import {useTheme} from "web/hooks/use-theme"
import {Row} from "web/components/layout/row";

export default function ThemeIcon(props: {
  className?: string
}) {
  const {className} = props
  const {theme, setTheme} = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto')
  }
  const children = theme === 'light' ? (
    'Light'
  ) : theme === 'dark' ? (
    'Dark'
  ) : (
    <>
      <span className="hidden dark:inline">Dark</span>
      <span className="inline dark:hidden">Light</span> (auto)
    </>
  )
  const icon = <>
    <MoonIcon className={clsx(className, 'hidden dark:block')}/>
    <SunIcon className={clsx(className, 'block dark:hidden')}/>
  </>
  return <button onClick={toggleTheme}>
    <Row className="items-center gap-1 border-2 border-gray-500 rounded-full p-1 max-w-fit mx-2">
      {icon}
    {children}
    </Row>
  </button>
}



