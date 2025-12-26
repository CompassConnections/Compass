import {createContext, useContext, useEffect, useState} from 'react'
import {defaultLocale} from "common/constants";


export type I18nContextType = {
  locale: string
  setLocale: (locale: string) => void
}

export const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {}
})

export function useLocale() {
  return useContext(I18nContext)
}

// export function t(key: string, english: string): string {
//   const locale = useLocale()
//   console.log({locale})
//
//   if (locale === defaultLocale) return english
//   return messages[locale]?.[key] ?? english
// }

export function useT() {
  const {locale} = useLocale()
  console.log({locale})
  const [messages, setMessages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (locale === defaultLocale) return

    import(`web/messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch(() => setMessages({}))
  }, [locale])

  return (key: string, fallback: string) => {
    if (locale === defaultLocale) return fallback
    return messages[key] ?? fallback
  }
}
