import {createContext, useContext, useEffect, useState} from 'react'
import {defaultLocale} from "common/constants";


export type I18nContextType = {
  locale: string
  setLocale: (locale: string) => void
}

export const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {
  }
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

const messageCache: Record<string, Record<string, string>> = {}

export function useT() {
  const {locale} = useLocale()
  const [messages, setMessages] = useState<Record<string, string>>(
    messageCache[locale] ?? {}
  )

  useEffect(() => {
    if (locale === defaultLocale) return
    if (messageCache[locale]) {
      setMessages(messageCache[locale])
      return
    }

    import(`web/messages/${locale}.json`)
      .then(mod => {
        messageCache[locale] = mod.default
        setMessages(mod.default)
      })
      .catch(() => setMessages({}))
  }, [locale])

  return (key: string, fallback: string, formatter?: any) => {
    const result = locale === defaultLocale ? fallback : messages[key] ?? fallback
    if (!formatter) return result
    if (typeof formatter === 'function') return formatter(result)
    if (typeof formatter === 'object') {
      let text = String(result)
      for (const [k, v] of Object.entries(formatter)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
      return text
    }
    return result
  }
}
