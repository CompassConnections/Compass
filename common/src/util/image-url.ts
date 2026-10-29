import {FIREBASE_STORAGE_URL, WEB_URL} from 'common/envs/constants'
import {DEV_CONFIG} from 'common/envs/dev'
import {PROD_CONFIG} from 'common/envs/prod'
import {uniq} from 'lodash'

/**
 * Buckets whose objects are ours. Both environments, not just the current one: dev data is seeded
 * with prod photo URLs, and either way nobody outside the project can read the bucket's access logs.
 */
const OWN_BUCKETS = uniq([
  PROD_CONFIG.firebaseConfig.storageBucket,
  DEV_CONFIG.firebaseConfig.storageBucket,
])

const OWN_WEB_ORIGINS = uniq([
  'https://compassmeet.com',
  'https://www.compassmeet.com',
  new URL(WEB_URL).origin,
])

const STORAGE_ORIGIN = new URL(FIREBASE_STORAGE_URL).origin

/**
 * Whether `src` is an image we serve ourselves, and so is safe to put in an `<img>` other members (or
 * their mail client) will load.
 *
 * A member's photo URLs are rendered for everyone who views them. If they could point at their own
 * server, every viewer's browser would request it: that reveals the viewer's IP address and, in the
 * new-message email, works as a read receipt. So only these are accepted:
 * - objects in one of our own Storage buckets — checked by bucket, not just by host, because
 *   `firebasestorage.googleapis.com` and `storage.googleapis.com` serve *anyone's* bucket, and the
 *   bucket's owner sees its access logs;
 * - static assets under `/images/` on our own site (the default avatar, the showcase portraits),
 *   absolute or root-relative. Any other path on our site is refused: one that redirects would lead
 *   the image request straight back off-site.
 */
export function isOwnImageUrl(src: string | null | undefined): boolean {
  if (!src) return false
  let url: URL
  try {
    // The base only matters for root-relative paths. `//evil.com/x` and `/\evil.com/x` parse to
    // evil.com, so they fall through to the host checks below and are refused there.
    url = new URL(src, WEB_URL)
  } catch {
    return false
  }

  const segments = url.pathname.split('/').filter(Boolean)

  // Compared by origin, so the scheme counts too: only the Storage emulator and the local dev server
  // are plain http.
  if (url.origin === STORAGE_ORIGIN || url.origin === 'https://firebasestorage.googleapis.com') {
    // `/v0/b/<bucket>/o/<path>` from the SDKs, `/<bucket>/<path>` from `generateAvatarUrl`.
    const bucket = segments[0] === 'v0' && segments[1] === 'b' ? segments[2] : segments[0]
    return OWN_BUCKETS.includes(bucket)
  }
  if (url.origin === 'https://storage.googleapis.com') {
    return OWN_BUCKETS.includes(segments[0])
  }
  if (OWN_WEB_ORIGINS.includes(url.origin)) {
    return segments[0] === 'images'
  }
  return false
}

/** `src` if it is one of ours (see {@link isOwnImageUrl}), otherwise undefined. */
export function ownImageUrlOrUndefined(src: string | null | undefined): string | undefined {
  return src && isOwnImageUrl(src) ? src : undefined
}
