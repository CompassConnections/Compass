import {DevicePhoneMobileIcon} from '@heroicons/react/24/outline'
import {ANDROID_APP_URL, IOS_APP_URL, IS_IOS_APP_PUBLISHED} from 'common/constants'
import {useEffect, useState} from 'react'
import {FaApple, FaGooglePlay} from 'react-icons/fa'
import {DeviceOS, deviceOS} from 'web/lib/util/webview'

/** The canonical "get the app" URL. What QR codes, emails and printed material should point at. */
export const DOWNLOAD_PAGE = '/download'

export type AppStore = 'ios' | 'android'

export type AppDownload = {
  /** `'unknown'` until the first effect runs — see the SSG note on `useAppDownload`. */
  device: DeviceOS | 'unknown'
  /** The store we can send this device straight to, or null if there isn't one to send it to. */
  store: AppStore | null
  /** Where a single "get the app" control should go. */
  href: string
  /** Translation key and English fallback for that control's label. */
  key: string
  label: string
  icon: React.ComponentType<{className?: string}>
}

/**
 * Resolve a device to the one download control it should be shown.
 *
 * Split out from the hook so the `/download` page can ask the same question about a device that
 * isn't the visitor's — it lays out all three answers side by side, and having the page hand-roll
 * a second copy of the "is the iOS listing live yet" rule is exactly how the two drift apart.
 *
 * Desktop, an unresolved device, and iOS-before-the-App-Store-listing-exists all collapse to the
 * same generic answer, pointing at `/download`. For the first two that's the right destination
 * anyway; for the third it is a fallback that stays honest — `IOS_APP_URL` is a placeholder until
 * App Store Connect assigns the id, and linking an iPhone at a 404 is worse than one extra tap.
 */
export function resolveAppDownload(device: DeviceOS | 'unknown'): AppDownload {
  if (device === 'android')
    return {
      device,
      store: 'android',
      href: ANDROID_APP_URL,
      key: 'download.cta.android',
      label: 'Get it on Google Play',
      icon: FaGooglePlay,
    }

  if (device === 'ios' && IS_IOS_APP_PUBLISHED)
    return {
      device,
      store: 'ios',
      href: IOS_APP_URL,
      key: 'download.cta.ios',
      label: 'Download on the App Store',
      icon: FaApple,
    }

  return {
    device,
    store: null,
    href: DOWNLOAD_PAGE,
    key: 'download.cta.generic',
    label: 'Get the app',
    icon: DevicePhoneMobileIcon,
  }
}

/**
 * The download control for whoever is looking at the page right now.
 *
 * Resolved in an effect rather than during render because web is statically exported: the build has
 * no visitor and no `navigator`, so anything read at render time is baked into HTML that is then
 * served to every device. Starting at `'unknown'` means the prerendered markup carries the generic
 * "Get the app" → `/download` variant — which is also the correct no-JS answer — and the label
 * sharpens to the visitor's store on hydration.
 */
export function useAppDownload(): AppDownload {
  const [device, setDevice] = useState<DeviceOS | 'unknown'>('unknown')

  useEffect(() => setDevice(deviceOS()), [])

  return resolveAppDownload(device)
}
