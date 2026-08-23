/**
 * The iOS shell is served from `capacitor://localhost`, where WKWebView provides no working cookie
 * jar — a `document.cookie` write is not readable back even in the same session. The language choice
 * therefore has to survive in `localStorage`, or the switcher silently reverts on every app launch.
 *
 * `testEnvironment` is `node`, so `document`, `localStorage` and `navigator` are stubbed by hand.
 */
import {getLocale, resetCachedLocale, setLocaleCookie} from 'web/lib/locale-cookie'

const cookies = new Map<string, string>()

function installStubs(languages: string[]) {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    get: () => ({
      get cookie() {
        return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
      },
      set cookie(raw: string) {
        const [pair] = raw.split(';').map((s) => s.trim())
        const [name, value] = pair.split('=')
        cookies.set(name, value)
      },
    }),
  })

  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  })

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {languages, language: languages[0]},
  })

  Object.defineProperty(globalThis, 'location', {configurable: true, value: {protocol: 'https:'}})
}

describe('locale persistence', () => {
  beforeEach(() => {
    cookies.clear()
    installStubs(['en-GB', 'en'])
    resetCachedLocale()
  })

  it('remembers the chosen language via the cookie', () => {
    setLocaleCookie('fr')
    resetCachedLocale()

    expect(getLocale()).toBe('fr')
  })

  it('still remembers it when the cookie did not survive, as on iOS', () => {
    setLocaleCookie('de')
    cookies.clear() // the app restarts; WKWebView kept nothing
    resetCachedLocale()

    expect(document.cookie).toBe('')
    expect(getLocale()).toBe('de')
  })

  it("falls back to the browser's preference when nothing was ever chosen", () => {
    installStubs(['fr-FR', 'fr'])
    resetCachedLocale()

    expect(getLocale()).toBe('fr')
  })
})
