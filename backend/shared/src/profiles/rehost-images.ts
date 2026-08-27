import {JSONContent} from '@tiptap/core'
import {FIREBASE_STORAGE_URL} from 'common/envs/constants'
import {YEAR_SECONDS} from 'common/util/time'
import {createHash} from 'crypto'
import {lookup} from 'dns/promises'
import {uniq} from 'lodash'
import {isIP} from 'net'
import {Bucket, getBucket} from 'shared/firebase-utils'
import {log} from 'shared/monitoring/log'

// A profile imported from a personal site, a Google Doc or a Notion page arrives with its images
// still pointing at whoever hosted the original page. Hotlinking them is a bad deal: the host can
// block the referer or take the file down, Google Docs' `googleusercontent` URLs expire outright,
// every visitor to the profile leaks a request to a third party, and next/image refuses any host
// missing from `remotePatterns` in web/next.config.ts. So we copy each image into our own bucket at
// import time and rewrite the src.

/** Beyond this we stop copying and leave the remaining images pointing at their original host. */
const MAX_IMAGES = 30
const MAX_BYTES_PER_IMAGE = 15 * 1024 ** 2
const FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 3

/**
 * The same folder the photo widget uploads to (`web/components/widgets/add-photos.tsx`), so a
 * profile's imported images sit beside the ones it uploaded — and `deleteUserFiles` takes them all
 * with the account.
 */
const storageFolder = (username: string) => `user-images/${username}/love-images`

/**
 * Where imported images go when there is no user to file them under — no signed-in user and no
 * username, which is what a script calling the import handler directly looks like. The dash makes
 * it a name `cleanUsername` can never produce, so it can never collide with a real profile's folder
 * or be swept away by that profile's `deleteUserFiles`.
 */
export const FALLBACK_IMAGE_FOLDER_NAME = 'unclaimed-imports'

// Only what a browser will actually render in an <img>. Anything else (svg above all — it executes
// script when opened directly) we leave alone rather than serve from our own origin.
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

/**
 * Hosts we already serve, or that next/image is already configured for — nothing to copy.
 *
 * The first entry is derived rather than written out because it is wherever {@link downloadUrl}
 * actually points, and that moves with the environment: under the Storage emulator it is
 * `localhost:9199`. A hardcoded list could never contain that, so a copy that had just been written
 * to our own bucket read back as somebody else's — which is how a local import ended up with the
 * photo in its bio and no profile picture pinned from it.
 */
const OWN_HOSTS = uniq([
  new URL(FIREBASE_STORAGE_URL).hostname.toLowerCase(),
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'compassmeet.com',
  'www.compassmeet.com',
])

/**
 * Copies every externally hosted image in `content` into `username`'s own folder in our storage
 * bucket and returns the content with those `src`s rewritten. Never throws: an image we cannot copy
 * keeps its original URL, which is exactly the behaviour we had before.
 */
export async function rehostExternalImages(
  content: JSONContent,
  username: string,
): Promise<JSONContent> {
  try {
    const srcs = uniq(collectImageSrcs(content)).filter(shouldRehost)
    if (srcs.length === 0) return content

    const bucket = getBucket()
    const folder = storageFolder(username)
    const rehosted = srcs.slice(0, MAX_IMAGES)
    if (srcs.length > rehosted.length) {
      log('Too many images to rehost; leaving the rest hotlinked', {
        total: srcs.length,
        rehosting: rehosted.length,
      })
    }

    const results = await Promise.all(
      rehosted.map(async (src) => [src, await rehostOne(src, bucket, folder)] as const),
    )
    const urlBySrc = Object.fromEntries(results.filter(([, url]) => !!url)) as Record<
      string,
      string
    >

    log('Rehosted imported images', {found: srcs.length, copied: Object.keys(urlBySrc).length})
    return rewriteImageSrcs(content, urlBySrc)
  } catch (error) {
    // An import that arrives with hotlinked images is still worth far more than a failed import.
    log('Rehosting images failed; keeping the original URLs', {error})
    return content
  }
}

async function rehostOne(src: string, bucket: Bucket, folder: string): Promise<string | undefined> {
  try {
    // Named after the source URL rather than a nanoid, so re-importing the same page overwrites the
    // copy instead of piling up a second one. `llm-extract-profile` caches its result for a day too,
    // which only works if these URLs are stable.
    const hash = createHash('sha256').update(src).digest('hex').slice(0, 32)

    // The extension is only known after the fetch, so look for an already-copied object under any
    // of the extensions we accept before paying for the download.
    for (const ext of uniq(Object.values(EXTENSION_BY_CONTENT_TYPE))) {
      const existing = bucket.file(`${folder}/${hash}.${ext}`)
      const [exists] = await existing.exists()
      if (exists) return downloadUrl(bucket, existing.name)
    }

    const fetched = await fetchImage(src)
    if (!fetched) return undefined

    const path = `${folder}/${hash}.${fetched.ext}`
    await bucket.file(path).save(fetched.buffer, {
      public: true,
      metadata: {
        contentType: fetched.contentType,
        cacheControl: `public, max-age=${YEAR_SECONDS}`,
      },
    })
    return downloadUrl(bucket, path)
  } catch (error) {
    log('Failed to rehost image', {src, error})
    return undefined
  }
}

async function fetchImage(src: string) {
  const response = await fetchFollowingSafeRedirects(src)
  if (!response?.ok) {
    log('Image fetch failed', {src, status: response?.status})
    return undefined
  }

  const contentType = (response.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  const ext = EXTENSION_BY_CONTENT_TYPE[contentType]
  if (!ext) {
    log('Skipping image with unsupported content type', {src, contentType})
    return undefined
  }

  const declaredLength = Number(response.headers.get('content-length'))
  if (declaredLength > MAX_BYTES_PER_IMAGE) {
    log('Skipping oversized image', {src, declaredLength})
    return undefined
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  // Re-checked after the fact: content-length is a claim, not a guarantee.
  if (buffer.byteLength > MAX_BYTES_PER_IMAGE) {
    log('Skipping oversized image', {src, size: buffer.byteLength})
    return undefined
  }

  return {buffer, contentType, ext}
}

/**
 * Follows redirects by hand so every hop is checked against {@link isPubliclyRoutable} — a public
 * URL that 302s to `169.254.169.254` is the standard way to turn a fetch-this-URL feature into a
 * read-our-metadata-service one.
 */
async function fetchFollowingSafeRedirects(src: string): Promise<Response | undefined> {
  let url = src
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isPubliclyRoutable(url))) {
      log('Refusing to fetch image from a non-public address', {src, url})
      return undefined
    }

    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8'},
    })

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      url = new URL(location, url).href
      continue
    }
    return response
  }

  log('Too many redirects fetching image', {src})
  return undefined
}

/** True for an http(s) URL whose host resolves to an address outside our own network. */
async function isPubliclyRoutable(url: string): Promise<boolean> {
  let hostname: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    hostname = parsed.hostname.replace(/^\[|]$/g, '')
  } catch {
    return false
  }

  if (isIP(hostname)) return !isPrivateAddress(hostname)

  try {
    const addresses = await lookup(hostname, {all: true})
    return addresses.length > 0 && addresses.every(({address}) => !isPrivateAddress(address))
  } catch {
    return false
  }
}

function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase()

  if (isIP(ip) === 6) {
    // IPv4-mapped (::ffff:10.0.0.1) is still IPv4 as far as the kernel is concerned.
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return (
      ip === '::' ||
      ip === '::1' ||
      ip.startsWith('fc') || // unique local
      ip.startsWith('fd') ||
      ip.startsWith('fe8') || // link-local
      ip.startsWith('fe9') ||
      ip.startsWith('fea') ||
      ip.startsWith('feb')
    )
  }

  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. the cloud metadata endpoint
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast and reserved
  )
}

/**
 * The first image in the document that we serve ourselves — the one worth pinning as the profile
 * photo. Deliberately never an image left hotlinked: an avatar is rendered through next/image
 * everywhere, which 400s on any host missing from `remotePatterns`.
 */
export function firstOwnedImageSrc(content: JSONContent): string | undefined {
  return collectImageSrcs(content).find(isOwnHost)
}

function shouldRehost(src: string): boolean {
  return isHttp(src) && !isOwnHost(src)
}

function isOwnHost(src: string): boolean {
  try {
    return isHttp(src) && OWN_HOSTS.includes(new URL(src).hostname.toLowerCase())
  } catch {
    return false
  }
}

function isHttp(src: string): boolean {
  try {
    const {protocol} = new URL(src)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

function downloadUrl(bucket: Bucket, path: string): string {
  return `${FIREBASE_STORAGE_URL}/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`
}

function collectImageSrcs(node: JSONContent): string[] {
  const here = node.type === 'image' && typeof node.attrs?.src === 'string' ? [node.attrs.src] : []
  return [...here, ...(node.content ?? []).flatMap(collectImageSrcs)]
}

function rewriteImageSrcs(node: JSONContent, urlBySrc: Record<string, string>): JSONContent {
  const src = node.type === 'image' ? node.attrs?.src : undefined
  const replacement = typeof src === 'string' ? urlBySrc[src] : undefined

  return {
    ...node,
    ...(replacement ? {attrs: {...node.attrs, src: replacement}} : {}),
    ...(node.content
      ? {content: node.content.map((child) => rewriteImageSrcs(child, urlBySrc))}
      : {}),
  }
}
