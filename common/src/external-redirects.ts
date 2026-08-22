// Relative, not the `common/...` alias the rest of the package uses: `web/next.config.ts` imports this
// file, and the loader Next compiles its config with resolves the alias only at the entry point — a
// nested `common/constants` from inside `common/src` resolves to nowhere and the config fails to load.
import {
  discordLink,
  githubRepo,
  instagramLink,
  kofiLink,
  liberapayLink,
  patreonLink,
  paypalLink,
  xLink,
} from './constants'

/**
 * Short paths on our own domain that are really just redirects to somewhere off-domain. Emails and
 * printed material link to these rather than to the destinations directly, so a moved invite link
 * or funding page never strands mail we already sent (see `backend/email/emails/utils.tsx`).
 *
 * Shared rather than declared in `web/next.config.ts` because two very different consumers need the
 * same map: the web build turns it into Next redirects, and the Android shell has to recognise these
 * paths when one arrives as a deep link. The app is a static export, so the Next redirects never run
 * there — without the second consumer `/discord` falls through to the `[username]` catch-all and the
 * app tries to open a profile named "discord".
 */
export const EXTERNAL_REDIRECTS: Record<string, string> = {
  '/discord': discordLink,
  '/patreon': patreonLink,
  '/x': xLink,
  '/paypal': paypalLink,
  '/instagram': instagramLink,
  '/kofi': kofiLink,
  '/github': githubRepo,
  '/liberapay': liberapayLink,
}

/**
 * The destination for a path, or undefined if it isn't one of these redirects. Takes anything
 * path-shaped — a bare slug, a full deep-link pathname, with or without query string, trailing
 * slash or casing — because the callers get it from Android intents, not from our own routing.
 */
export const getExternalRedirect = (path: string | null | undefined) => {
  if (!path) return undefined
  const slug = path.split(/[?#]/)[0].trim().toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '')
  return EXTERNAL_REDIRECTS['/' + slug]
}
