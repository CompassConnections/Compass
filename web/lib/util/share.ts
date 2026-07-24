import {Share} from '@capacitor/share'
import {isAndroidApp} from 'web/lib/util/webview'

/**
 * Open the OS share sheet, returning whether it actually opened.
 *
 * Two paths, because the Web Share API is not one API everywhere: Android's System WebView — which is
 * what the Capacitor app runs in — does not implement `navigator.share` at all, and even a WebView that
 * did would hide it in dev, where the app loads the cleartext `http://10.0.2.2:3000` (the Web Share API
 * is secure-context only). So native goes through the Capacitor bridge and the browser keeps using
 * `navigator.share`.
 *
 * `false` means "no sheet appeared" — the caller should fall back (copy the link, open a new tab, ...).
 * A user dismissing the sheet rejects the underlying promise too, so it also reports `false`; re-copying
 * the link after a deliberate cancel is harmless, and there is no way to tell the two apart.
 */
export async function nativeShare(data: {title?: string; text?: string; url: string}) {
  const {title, text, url} = data

  if (isAndroidApp()) {
    console.log('Native share', {title, text, url})
    try {
      await Share.share({title, text, url})
      return true
    } catch (e) {
      console.log('Native share unavailable or dismissed', e)
      return false
    }
  }

  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false

  try {
    await navigator.share({title, text, url})
    return true
  } catch (e) {
    console.log('Web share failed or dismissed', e)
    return false
  }
}
