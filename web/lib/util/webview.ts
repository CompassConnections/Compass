import {Capacitor} from '@capacitor/core'
import {IS_WEBVIEW} from 'common/hosting/constants'

/**
 * Whether we're running inside the native shell (Capacitor) rather than a browser.
 *
 * `IS_WEBVIEW` is the build-time half — the static export shipped inside the app is built with
 * `NEXT_PUBLIC_WEBVIEW=1` — and `Capacitor.isNativePlatform()` is the runtime half, which also
 * covers the dev mode where the app loads the dev server over the LAN.
 */
export function isNativeApp() {
  try {
    return Capacitor.isNativePlatform() || IS_WEBVIEW
  } catch {
    return false
  }
}

/**
 * The concrete platform, for the handful of places where behaviour genuinely diverges (App Store
 * rules, APNs vs FCM, the Android-only `AndroidBridge`). Prefer `isNativeApp()` everywhere else —
 * the product is meant to look the same on both.
 */
export function nativePlatform(): 'ios' | 'android' | 'web' {
  try {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
  } catch {
    return 'web'
  }
}

export function isIosApp() {
  return isNativeApp() && nativePlatform() === 'ios'
}

export function isAndroidApp() {
  return isNativeApp() && nativePlatform() === 'android'
}

export function isNativeMobile() {
  return isNativeApp()
}

/**
 * Which *device* we are being viewed on — a different question from `nativePlatform()`.
 *
 * `nativePlatform()` answers "which shell is running this code"; this answers "which store could
 * this visitor install from". A Safari tab on an iPhone is `nativePlatform() === 'web'` and
 * `deviceOS() === 'ios'`, and that gap is the whole point: it is what lets the download CTA name
 * the right store instead of asking.
 *
 * iPadOS 13+ is why this can't just read `navigator.platform`. An iPad reports `MacIntel` and is
 * otherwise indistinguishable from a laptop, so every naive check files it under "desktop" and
 * offers it a QR code to scan with itself. There is no touch-capable Mac, so `maxTouchPoints > 1`
 * on a Mac-shaped UA is the standard tell.
 *
 * Browser-only: touches `navigator`, so it must not run during SSG. Read it through
 * `useAppDownload()` rather than calling it in a render body.
 */
export type DeviceOS = 'ios' | 'android' | 'desktop'

export function deviceOS(): DeviceOS {
  if (typeof navigator === 'undefined') return 'desktop'

  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  // The iPadOS-pretending-to-be-a-Mac case.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios'
  return 'desktop'
}
