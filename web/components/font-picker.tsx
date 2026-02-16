'use client'

import clsx from 'clsx'
import {useFontPreference, FontOption} from 'web/hooks/use-font-preference'
import {useT} from 'web/lib/locale'

const FONT_OPTIONS: FontOption[] = ['atkinson', 'system-sans', 'classic-serif']

export function FontPicker(props: { className?: string } = {}) {
  const {className} = props
  const {font, setFont} = useFontPreference()
  const t = useT()

  return (
    <select
      id="font-picker"
      value={font}
      onChange={(e) => setFont(e.target.value as FontOption)}
      className={clsx('rounded-md border border-gray-300 px-2 py-1 text-sm bg-canvas-50', className)}
    >
      {FONT_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {t(`font.${option}`, option)}
        </option>
      ))}
    </select>
  )
}
