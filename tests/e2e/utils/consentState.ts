import {Browser, BrowserContext, BrowserContextOptions} from '@playwright/test'

/**
 * Every browser context starts with the analytics question already answered.
 *
 * `ConsentBanner` is a fixed card in the bottom-right corner, and nothing in the suite ever dismisses
 * it, so it sits there for the whole run and intercepts pointer events aimed at anything else in that
 * corner — the message composer's send button most of all. Answering up front is also closer to the
 * state the tests are actually about: a returning member, not a first-ever visit.
 *
 * "denied" rather than "granted" so PostHog is never initialised against the test project.
 *
 * Keep the name in sync with `CONSENT_COOKIE` in `web/lib/consent.ts`.
 */
export const consentStorageState: BrowserContextOptions['storageState'] = {
  cookies: [
    {
      name: 'analytics-consent',
      value: 'denied',
      // The suite only ever runs against http://localhost:3000 (see `baseURL` in playwright.config).
      domain: 'localhost',
      path: '/',
      // A session cookie: it only has to outlive the context it is set on.
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ],
  origins: [],
}

/**
 * `browser.newContext()` ignores the `use` block in playwright.config, so contexts a test builds by
 * hand (a second signed-in user, say) have to opt into the consent state explicitly. Use this instead
 * of `browser.newContext()` anywhere in the web suite.
 */
export function newTestContext(
  browser: Browser,
  options?: BrowserContextOptions,
): Promise<BrowserContext> {
  return browser.newContext({storageState: consentStorageState, ...options})
}
