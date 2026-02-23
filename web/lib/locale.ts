import {defaultLocale} from 'common/constants'
import {getTranslationMethod} from 'common/translate'
import {createContext, useContext, useEffect, useState} from 'react'

export type I18nContextType = {
  locale: string
  setLocale: (locale: string) => void
}

export const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
})

export function useLocale() {
  return useContext(I18nContext)
}

const messageCache: Record<string, Record<string, string>> = {}

export function useT() {
  const {locale} = useLocale()
  const [messages, setMessages] = useState<Record<string, string>>(messageCache[locale] ?? {})

  useEffect(() => {
    if (locale === defaultLocale) return
    if (messageCache[locale]) {
      setMessages(messageCache[locale])
      return
    }

    import(`common/messages/${locale}.json`)
      .then((mod) => {
        messageCache[locale] = mod.default
        setMessages(mod.default)
      })
      .catch(() => setMessages({}))
  }, [locale])

  return getTranslationMethod(locale, messages)
}
