import {defaultLocale, Locale, supportedLocales} from 'common/constants'
import {setCookie} from 'web/lib/util/cookie'

let cachedLocale: string | null | undefined = null

const ONE_YEAR_SECS = 60 * 60 * 24 * 365

/**
 * The chosen language, mirrored into `localStorage` for the native shells.
 *
 * WKWebView gives a custom-scheme origin no working cookie jar at all — on `capacitor://localhost`
 * a `document.cookie` write is not even readable back in the same session, let alone after a restart.
 * Without this the iOS language switcher appeared to do nothing that survived: `getLocale()` fell
 * through to `getBrowserLocale()` on every launch, so a French user got French only when their phone
 * was already French.
 *
 * The cookie stays authoritative on the web, where it is also what a server render would read.
 */
const LOCALE_KEY = 'lang'

const readStoredLocale = (): string | undefined => {
  try {
    return localStorage.getItem(LOCALE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Writes the `lang` cookie that `getLocale` below reads back.
 *
 * Lives here rather than inline in `_app` so the write and the read stay in one file, and so the
 * cookie gets attributes at all: it used to be a bare `document.cookie = 'lang=...'`, which means
 * `SameSite=None`-ish default behaviour in older browsers and no `Secure` flag.
 *
 * `Secure` is conditional rather than always-on because the local Android build is served over
 * cleartext `http://10.0.2.2:3000` (see `capacitor.config.ts`) — a `Secure` cookie there is dropped
 * silently, which would leave the language switcher doing nothing with no error to explain it.
 */
export function setLocaleCookie(locale: string) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // Unavailable in incognito or a locked-down webview; the cookie below still gets written.
  }

  setCookie('lang', locale, [
    ['path', '/'],
    ['max-age', ONE_YEAR_SECS.toString()],
    ['samesite', 'lax'],
    ...(typeof location !== 'undefined' && location.protocol === 'https:' ? [['secure']] : []),
  ])
}

export const resetCachedLocale = () => {
  cachedLocale = null
}

export function getLocale(): string {
  // req?: IncomingMessage
  if (cachedLocale) return cachedLocale
  // console.log('cachedLocale', cachedLocale)
  let cookie = null
  // Server
  // if (req?.headers?.cookie) {
  //   cookie = req.headers.cookie
  // }

  // Client
  if (typeof document !== 'undefined') {
    cookie = document.cookie
  }

  if (cookie) {
    // console.log('Cookie', cookie)
    cachedLocale = cookie
      .split(' ')
      .find((c) => c.startsWith('lang='))
      ?.split('=')[1]
      ?.split(' ')[0]
      ?.replace(';', '')
    // console.log('Locale cookie', cachedLocale)
  }

  // Before the browser's own preference: an explicit choice the cookie could not keep still beats
  // guessing from `navigator.languages`.
  if (!cachedLocale) {
    cachedLocale = readStoredLocale()
  }

  if (!cachedLocale) {
    cachedLocale = getBrowserLocale()
  }

  // console.log('Locale cookie browser', getBrowserLocale())

  return cachedLocale ?? defaultLocale
}

export function getBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null

  const languages = navigator.languages ?? [navigator.language]
  // console.log('Browser languages', languages, navigator.language)

  for (const lang of languages) {
    const base = lang.split('-')[0] as Locale
    if (supportedLocales.includes(base)) {
      return base
    }
  }

  return null
}
