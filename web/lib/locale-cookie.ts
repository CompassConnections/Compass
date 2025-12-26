import type {IncomingMessage} from 'http'
import {defaultLocale, supportedLocales, Locale} from "common/constants"

let cachedLocale: string | null | undefined = null

export function getLocale(req?: IncomingMessage): string {
  // if (cachedLocale) return cachedLocale
  console.log('cachedLocale', cachedLocale)
  let cookie = null
  // Server
  if (req?.headers?.cookie) {
    cookie = req.headers.cookie
  }

  // Client
  if (typeof document !== 'undefined') {
    cookie = document.cookie
  }

  if (cookie) {
    console.log('Cookie', cookie)
    cachedLocale = cookie
      .split(' ')
      .find(c => c.startsWith('lang='))
      ?.split('=')[1]
      ?.split(' ')[0]
    console.log('Locale cookie', cachedLocale)
  }

  if (!cachedLocale) {
    cachedLocale = getBrowserLocale()
  }

  console.log('Locale cookie browser', getBrowserLocale())

  return cachedLocale ?? defaultLocale
}

export function getBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null

  const languages = navigator.languages ?? [navigator.language]
  console.log('Browser languages', languages, navigator.language)

  for (const lang of languages) {
    const base = lang.split('-')[0] as Locale
    if (supportedLocales.includes(base)) {
      return base
    }
  }

  return null
}
