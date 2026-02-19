'use client'

import clsx from 'clsx'
import {LOCALES} from 'common/constants'
import {useLocale} from 'web/lib/locale'

export function LanguagePicker(props: {className?: string} = {}) {
  const {className} = props
  const {locale, setLocale} = useLocale()

  return (
    <select
      id="locale-picker"
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      className={clsx(
        'rounded-md border border-gray-300 px-2 py-1 text-sm bg-canvas-50',
        className,
      )}
    >
      {Object.entries(LOCALES).map(([key, v]) => (
        <option key={key} value={key}>
          {v}
        </option>
      ))}
    </select>
  )
}
