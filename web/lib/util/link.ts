/**
 * The hosts the Android app claims in its deep-link intent filter (`android/app/src/main/AndroidManifest.xml`).
 * Other compassmeet subdomains (`dev.`, previews) stay external — the app doesn't intercept them, so
 * rewriting one to a path would silently land the user on the *current* environment's copy of the page.
 */
const COMPASS_HOSTS = ['compassmeet.com', 'www.compassmeet.com']

/**
 * The in-app path an href points at, or undefined if the link leaves Compass.
 *
 * A Compass link pasted into a chat message arrives as an absolute URL (`https://compassmeet.com/…`).
 * Rendered as-is, the Android WebView hands it to the OS, which opens Chrome, which bounces back
 * into the app through the deep-link intent filter — a visible round trip for what should be a
 * client-side route change. Resolving it to a path lets `next/link` handle it directly.
 *
 * The current origin counts as internal too: in the WebView the app is served from `https://localhost`,
 * and in local dev from `http://localhost:3000`.
 */
export const internalPathOf = (href: string): string | undefined => {
  if (href.startsWith('/')) return href

  const base = typeof window === 'undefined' ? undefined : window.location.href
  let url: URL
  try {
    url = new URL(href, base)
  } catch {
    return undefined // mailto:, tel:, or not a URL at all
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
  const isInternal =
    COMPASS_HOSTS.includes(url.hostname) ||
    (typeof window !== 'undefined' && url.host === window.location.host)
  if (!isInternal) return undefined

  return url.pathname + url.search + url.hash
}
