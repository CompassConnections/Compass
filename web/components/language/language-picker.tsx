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
      data-testid="sidebar-locale-picker"
      value={locale}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocale(e.target.value)}
      className={clsx(
        'rounded-lg border border-canvas-300 bg-canvas-50 px-3 py-2 text-sm text-ink-1000 transition-colors hover:border-primary-400 focus:border-primary-500 focus:outline-none',
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
