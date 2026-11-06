const BASE = 'https://compass.invalid'

/**
 * The same-site path a `?redirect=` value points at, or null if it could leave Compass.
 *
 * The value comes from the URL, so anyone can put one in a link to the real sign-in page. Left
 * unchecked, the member signs in on the genuine site and is then sent to a look-alike, at the moment
 * they are least suspicious; a `javascript:` value would run in our origin.
 *
 * Decided by parsing rather than by looking at the leading characters, because the browser reads more
 * as "another host" than a prefix test catches: `//evil.com`, `/\evil.com`, `/<tab>/evil.com`. The
 * parsed path is what gets returned, so what was checked is what gets navigated to. That is also why
 * the final `//` test is needed: `/.//evil.com` parses as same-site, then normalises to `//evil.com`.
 */
export function safeRedirectPath(path: string | null | undefined) {
  if (!path?.startsWith('/')) return null
  try {
    const url = new URL(path, BASE)
    if (url.origin !== BASE || url.pathname.startsWith('//')) return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}
