import {ANDROID_APP_URL, IS_IOS_APP_PUBLISHED} from 'common/constants'
import {resolveAppDownload} from 'web/hooks/use-app-download'
import {deviceOS} from 'web/lib/util/webview'

/**
 * The download CTA resolves off `navigator`, and the failure mode is silent: a wrong branch doesn't
 * throw, it just sends an iPhone to Google Play. So the two things worth pinning are the UA table
 * (particularly the iPad case, which every naive check gets wrong) and the rule that we never link
 * at a store listing that doesn't exist yet.
 */

const withUA = (userAgent: string, maxTouchPoints = 0) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: {userAgent, maxTouchPoints},
    configurable: true,
    writable: true,
  })
}

const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ reports itself as a Mac, touch points and all — this is the one the old
  // `navigator.platform` check filed under "desktop".
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  pixel:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
}

describe('deviceOS', () => {
  it('reads iPhone and Android off the user agent', () => {
    withUA(UA.iphone)
    expect(deviceOS()).toBe('ios')

    withUA(UA.pixel)
    expect(deviceOS()).toBe('android')
  })

  it('recognises an iPad despite its Mac-shaped user agent', () => {
    withUA(UA.ipad, 5)
    expect(deviceOS()).toBe('ios')
  })

  it('leaves a real Mac — same UA, no touch — as desktop', () => {
    withUA(UA.mac, 0)
    expect(deviceOS()).toBe('desktop')

    withUA(UA.windows, 0)
    expect(deviceOS()).toBe('desktop')
  })
})

describe('resolveAppDownload', () => {
  it('sends Android straight to the Play listing', () => {
    const {store, href} = resolveAppDownload('android')
    expect(store).toBe('android')
    expect(href).toBe(ANDROID_APP_URL)
  })

  it('never links iOS at a store listing that does not exist yet', () => {
    const {store, href} = resolveAppDownload('ios')

    if (IS_IOS_APP_PUBLISHED) {
      expect(store).toBe('ios')
      expect(href).toContain('apps.apple.com')
    } else {
      // The placeholder id must not reach a user — /download explains the situation instead.
      expect(store).toBeNull()
      expect(href).toBe('/download')
    }
    expect(href).not.toContain('APPLE_ID')
  })

  it('falls back to /download on desktop and before hydration resolves the device', () => {
    for (const device of ['desktop', 'unknown'] as const) {
      const {store, href} = resolveAppDownload(device)
      expect(store).toBeNull()
      expect(href).toBe('/download')
    }
  })
})
