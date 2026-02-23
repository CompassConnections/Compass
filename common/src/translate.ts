import {defaultLocale} from 'common/constants'

export function getTranslationMethod(locale: string | undefined, messages: Record<string, string>) {
  return (key: string, fallback: string, formatter?: any): string => {
    const result = locale === defaultLocale ? fallback : (messages[key] ?? fallback)
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
