import {useEffect} from 'react'
import {isNativeApp} from 'web/lib/util/webview'

/** Internal navigation links and images: the two things a long press should do nothing on. */
function isSuppressedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  if (target.closest('img')) return true
  const link = target.closest('a')
  // No href means an anchor used as a button; a same-origin href is in-app navigation. Links that
  // leave the app keep their long press, so a member can still check or copy where one goes.
  return !!link && (!link.href || link.origin === window.location.origin)
}

/**
 * In the native apps, stops a long press on an internal link or an image from surfacing the URL.
 *
 * The WebView treats every `<a>` as a hyperlink, so holding a nav item or a profile card shows what a
 * browser would: on iOS the link preview and its action sheet, on Android a drag shadow carrying the
 * URL. Neither belongs in something meant to feel like an app. The CSS under `.native-app` in
 * `globals.css` does most of the work (and is the only thing that works on iOS, which fires no
 * `contextmenu` event); the listeners here catch what CSS cannot reach on Android.
 *
 * Deliberately not applied on the website, where long press / right click is how people open a link
 * in a new tab, and not applied to prose or external links anywhere.
 */
export function useSuppressLinkLongPress() {
  useEffect(() => {
    if (!isNativeApp()) return
    document.documentElement.classList.add('native-app')
    const block = (e: Event) => {
      if (isSuppressedTarget(e.target)) e.preventDefault()
    }
    document.addEventListener('contextmenu', block)
    document.addEventListener('dragstart', block)
    return () => {
      document.documentElement.classList.remove('native-app')
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('dragstart', block)
    }
  }, [])
}
