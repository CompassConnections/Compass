'use client'

import {getCookie, getCookiesFromString, setCookie} from 'web/lib/util/cookie'

/**
 * Whether the visitor has agreed to the analytics that are not strictly necessary — PostHog, and
 * Sentry's session replay. See `/privacy#cookies-and-local-storage`, which describes exactly this.
 *
 * Nothing in this module is itself consent-requiring: recording that someone said no is the textbook
 * example of a strictly-necessary cookie, and it has to be one, because the alternative is asking the
 * same person on every page load.
 */
export type Consent = 'granted' | 'denied'

const CONSENT_COOKIE = 'analytics-consent'

/**
 * A year — the same span the locale cookie runs for, and well short of the ten years the auth cookie
 * used to. The answer is not meant to be permanent: after this the banner asks once more, rather than
 * treating a decision made about an older version of the stack as settled forever.
 */
const ONE_YEAR_SECS = 60 * 60 * 24 * 365

/**
 * A cookie rather than `localStorage` because `deleteAccount()` and `onAuthLoggedOut()` both call
 * `localStorage.clear()`. Storing the choice there would mean signing out silently withdrew consent
 * and re-showed the banner, which reads as the banner being broken.
 */
export function getConsent(): Consent | undefined {
  if (typeof document === 'undefined') return undefined
  const value = getCookie(CONSENT_COOKIE)
  return value === 'granted' || value === 'denied' ? value : undefined
}

export function recordConsent(consent: Consent) {
  setCookie(CONSENT_COOKIE, consent, [
    ['path', '/'],
    ['max-age', ONE_YEAR_SECS.toString()],
    ['samesite', 'lax'],
    // Conditional for the same reason the locale cookie's is — the local Android build is served
    // over cleartext http, where a Secure cookie is dropped without a word.
    ...(typeof location !== 'undefined' && location.protocol === 'https:' ? [['secure']] : []),
  ])
  if (consent === 'denied') purgeAnalyticsStorage()
}

/**
 * Deletes what PostHog left behind.
 *
 * Needed because the banner ships *after* the analytics did: a visitor who has been using Compass for
 * months already has a `ph_…_posthog` cookie and its `localStorage` twin holding a device id. Only
 * stopping future collection would leave that id sitting on their machine for another year, which is
 * not what "no" means. `posthog.reset()` is not usable here — when consent is denied PostHog is never
 * initialised, so there is no instance to reset.
 */
function purgeAnalyticsStorage() {
  if (typeof document === 'undefined') return

  for (const name of Object.keys(getCookiesFromString(document.cookie))) {
    if (!name.startsWith('ph_') && !name.startsWith('dmn_chk')) continue
    // Cleared at both the exact host and the registrable domain: PostHog writes cross-subdomain
    // where it can, and a cookie set on `.compassmeet.com` is untouched by a delete scoped to
    // `www.compassmeet.com`.
    for (const domain of ['', location.hostname, `.${location.hostname.replace(/^www\./, '')}`]) {
      setCookie(name, '', [
        ['path', '/'],
        ['max-age', '0'],
        ...(domain ? [['domain', domain]] : []),
      ])
    }
  }

  try {
    // Collected before removing: deleting while walking the index shifts every key after it, which
    // silently skips half of them. Walked via the `key(i)`/`length` API rather than `Object.keys`
    // because that is what `Storage` actually guarantees.
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('ph_') || key.startsWith('__ph_'))) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // localStorage can be unavailable (incognito, embedded webviews); the cookies above are the part
    // that matters and they are already gone.
  }
}
