'use client'

import clsx from 'clsx'
import {FontOption, useFontPreference} from 'web/hooks/use-font-preference'
import {useT} from 'web/lib/locale'

const FONT_OPTIONS: FontOption[] = ['atkinson', 'system-sans', 'classic-serif']

const EN_TRANSLATIONS = {
  atkinson: 'Atkinson Hyperlegible',
  'system-sans': 'Sytem Sans-serif',
  'classic-serif': 'Classic Serif',
}

export function FontPicker(props: {className?: string} = {}) {
  const {className} = props
  const {font, setFont} = useFontPreference()
  const t = useT()

  return (
    <select
      data-testid="settings-font-picker"
      id="font-picker"
      value={font}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFont(e.target.value as FontOption)}
      className={clsx(
        'rounded-md border border-gray-300 px-2 py-1 text-sm bg-canvas-50',
        className,
      )}
    >
      {FONT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {t(`font.${option}`, EN_TRANSLATIONS[option] ?? option)}
        </option>
      ))}
    </select>
  )
}

//Exported types for test files to use when referencing the keys of the choices objects
export type FontsTuple = {
  [K in keyof typeof EN_TRANSLATIONS]: [K, (typeof EN_TRANSLATIONS)[K]]
}[keyof typeof EN_TRANSLATIONS]
