'use client'

import {useLocale} from "web/lib/locale";
import {LOCALES} from "common/constants";


export function LanguagePicker() {
  const {locale, setLocale} = useLocale()

  return (
    <select
      id="locale-picker"
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1 text-sm bg-canvas-50"
    >
      {Object.entries(LOCALES).map(([key, v]) => (
        <option key={key} value={key}>
          {v}
        </option>
      ))}
    </select>
  )
}
