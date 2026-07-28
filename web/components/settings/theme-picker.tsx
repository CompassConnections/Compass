import {ComputerDesktopIcon, MoonIcon, SunIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {pillBase, pillColors} from 'web/components/widgets/choices-toggle-group'
import {useTheme} from 'web/hooks/use-theme'
import {useT} from 'web/lib/locale'

type ThemeOption = 'light' | 'dark' | 'auto'

/**
 * Light / Dark / Auto as three pills.
 *
 * The previous control was a single button that cycled and labelled itself with the *current* state
 * ("Dark (auto)"). A control that only ever shows where you are hides both that a third option
 * exists and how many clicks away it is — you had to press it and watch to find out. Three pills say
 * the whole state space at a glance and cost one click to reach any of it.
 *
 * Built on `pillBase`/`pillColors` rather than `ChoicesToggleGroup` because each option carries an
 * icon and its own test id; the pill spec itself is shared so the two read as one control type.
 */
export function ThemePicker(props: {className?: string}) {
  const {className} = props
  const {theme, setTheme} = useTheme()
  const t = useT()

  const options: {value: ThemeOption; label: string; icon: typeof SunIcon}[] = [
    {value: 'light', label: t('theme.light', 'Light'), icon: SunIcon},
    {value: 'dark', label: t('theme.dark', 'Dark'), icon: MoonIcon},
    {value: 'auto', label: t('theme.auto', 'Auto'), icon: ComputerDesktopIcon},
  ]

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.general.theme', 'Theme')}
      data-testid="settings-dark-light-toggle"
      className={clsx('flex flex-row flex-wrap gap-2', className)}
    >
      {options.map(({value, label, icon: Icon}) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          data-testid={`settings-theme-${value}`}
          onClick={() => setTheme(value)}
          className={clsx(pillBase, pillColors['indigo-dark'], 'gap-1.5')}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}
