/**
 * The consent gate is the one piece of this that has a legal consequence if it is wrong: a `denied`
 * that does not stick, or a purge that misses the id PostHog already wrote, is the difference between
 * honouring a refusal and only appearing to. Hence tests for the storage layer rather than the UI.
 *
 * `testEnvironment` here is `node`, so `document` and `localStorage` are stubbed by hand — enough of
 * each for the cookie round-trip and the purge, and no more.
 */

import {clearLocalStoragePreservingConsent, getConsent, recordConsent} from 'web/lib/consent'

const cookies = new Map<string, string>()

/** A `document.cookie` faithful to the one behaviour that matters: writing `max-age=0` deletes. */
function installDocumentStub() {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    get: () => ({
      get cookie() {
        return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
      },
      set cookie(raw: string) {
        const [pair, ...attrs] = raw.split(';').map((s) => s.trim())
        const eq = pair.indexOf('=')
        const name = pair.slice(0, eq)
        const value = pair.slice(eq + 1)
        if (attrs.some((a) => a.toLowerCase() === 'max-age=0')) cookies.delete(name)
        else cookies.set(name, value)
      },
    }),
  })
}

function installLocationStub(protocol: string) {
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: {protocol, hostname: 'www.compassmeet.com'},
  })
}

function installLocalStorageStub(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      get length() {
        return store.size
      },
      key: (i: number) => [...store.keys()][i] ?? null,
    },
  })
  return store
}

describe('analytics consent', () => {
  beforeEach(() => {
    cookies.clear()
    installDocumentStub()
    installLocationStub('https:')
    installLocalStorageStub()
  })

  it('is undefined until a choice is made', () => {
    expect(getConsent()).toBeUndefined()
  })

  it('round-trips both answers', () => {
    recordConsent('granted')
    expect(getConsent()).toBe('granted')

    recordConsent('denied')
    expect(getConsent()).toBe('denied')
  })

  /**
   * WKWebView does not persist `document.cookie` for a custom scheme, so in the iOS shell
   * (`capacitor://localhost`) the cookie is gone by the next launch. Without the mirror the banner
   * asks again on every app start.
   */
  it('still remembers the answer when the cookie did not survive, as on iOS', () => {
    recordConsent('denied')
    cookies.clear() // the app restarts; WKWebView kept nothing

    expect(document.cookie).toBe('')
    expect(getConsent()).toBe('denied')
  })

  it('carries consent across the localStorage wipe that sign-out and deletion perform', () => {
    recordConsent('granted')
    cookies.clear()

    clearLocalStoragePreservingConsent()

    expect(getConsent()).toBe('granted')
  })

  it('ignores a cookie value that is neither answer', () => {
    document.cookie = 'analytics-consent=maybe'
    // Anything but the two known answers has to read as "not asked yet" — treating a corrupted or
    // hand-edited value as consent would be the worst possible way to fail.
    expect(getConsent()).toBeUndefined()
  })

  it('leaves other cookies alone when declining', () => {
    document.cookie = 'lang=fr'
    document.cookie = 'ph_abc123_posthog=%7B%22distinct_id%22%3A%22x%22%7D'

    recordConsent('denied')

    expect(cookies.has('lang')).toBe(true)
    expect(cookies.has('analytics-consent')).toBe(true)
  })

  it('deletes PostHog cookies left over from before the banner shipped', () => {
    document.cookie = 'ph_abc123_posthog=%7B%22distinct_id%22%3A%22x%22%7D'
    document.cookie = 'dmn_chk_0199=1'

    recordConsent('denied')

    expect(cookies.has('ph_abc123_posthog')).toBe(false)
    expect(cookies.has('dmn_chk_0199')).toBe(false)
  })

  it('deletes PostHog local storage too, since the cookie is only half of where the id lives', () => {
    const store = installLocalStorageStub({
      ph_abc123_posthog: '{"distinct_id":"x"}',
      __ph_opt_in_out_abc123: '1',
      'device-token': 'keep-me',
      theme: 'dark',
    })

    recordConsent('denied')

    expect(store.has('ph_abc123_posthog')).toBe(false)
    expect(store.has('__ph_opt_in_out_abc123')).toBe(false)
    // The necessary keys are not analytics and must survive a refusal.
    expect(store.get('device-token')).toBe('keep-me')
    expect(store.get('theme')).toBe('dark')
  })

  it('keeps nothing to purge when consent is granted', () => {
    const store = installLocalStorageStub({ph_abc123_posthog: '{"distinct_id":"x"}'})

    recordConsent('granted')

    expect(store.has('ph_abc123_posthog')).toBe(true)
  })
})
