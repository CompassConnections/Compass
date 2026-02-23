import {defaultLocale} from 'common/constants'
import {getTranslationMethod} from 'common/translate'
import {readFileSync} from 'fs'
import {join} from 'path'

const messageCache: Record<string, Record<string, string>> = {}

export function loadMessages(locale: string): Record<string, string> {
  if (messageCache[locale]) return messageCache[locale]

  try {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'common',
      'src',
      'messages',
      `${locale}.json`,
    )
    const raw = readFileSync(filePath, 'utf-8')
    messageCache[locale] = JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load messages for locale', locale, e)
    messageCache[locale] = {}
  }

  return messageCache[locale]
}

export function createT(locale: string | undefined) {
  locale = locale ?? defaultLocale
  const messages = locale === defaultLocale ? {} : loadMessages(locale)
  return getTranslationMethod(locale, messages)
}
