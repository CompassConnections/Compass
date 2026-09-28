/**
 * Downloads the home-page hero clips into public/videos/ at build time.
 *
 * The videos are ~1.8 MB each and are not committed (see the root .gitignore). They live in
 * Cloudflare R2, but they are pulled in during the build rather than served from R2 at runtime:
 *
 *  - Delivery stays same-origin on Vercel's CDN, so the hero costs no extra DNS lookup or TLS
 *    handshake, and there is no third-party dependency in the request path for a visitor.
 *  - R2 is hit roughly once per deploy instead of once per visitor, so the r2.dev public URL is
 *    fine here — its rate limit only matters for per-visitor serving.
 *  - No R2 custom domain is required, which matters because that needs the domain to be a zone in
 *    the same Cloudflare account, and compassmeet.com is on Vercel DNS.
 *
 * Any failure to obtain the assets fails the build. None of them are committed, so a "successful"
 * build without them ships a home page whose hero is an empty frame — louder is better.
 *
 * Configure `MEDIA_SOURCE_BASE_URL` in the Vercel project (and locally if you want it) to the
 * bucket's public base URL — e.g. https://pub-<hash>.r2.dev. Not NEXT_PUBLIC_: this is read by the
 * build, never by the browser.
 *
 * Upload new renders with `npm run upload:media` from media-creator/.
 */

import {createWriteStream} from 'node:fs'
import {mkdir, readFile, stat} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(HERE, '../public')

/**
 * Bucket key -> path under public/. The posters live here too: because the build copies everything
 * into public/, they are still served same-origin off Vercel's CDN, so keeping them in R2 costs the
 * LCP nothing and keeps another ~270 KB of binaries out of git.
 */
const ASSETS = [
  {key: 'videos/search-demo-light.mp4', dest: 'videos/search-demo-light.mp4'},
  {key: 'videos/search-demo-dark.mp4', dest: 'videos/search-demo-dark.mp4'},
  {key: 'images/search-demo-poster-light.jpg', dest: 'images/search-demo-poster-light.jpg'},
  {key: 'images/search-demo-poster-dark.jpg', dest: 'images/search-demo-poster-dark.jpg'},
  {key: 'videos/search-alert-light.mp4', dest: 'videos/search-alert-light.mp4'},
  {key: 'videos/search-alert-dark.mp4', dest: 'videos/search-alert-dark.mp4'},
  {key: 'images/search-alert-poster-light.jpg', dest: 'images/search-alert-poster-light.jpg'},
  {key: 'images/search-alert-poster-dark.jpg', dest: 'images/search-alert-poster-dark.jpg'},
  {key: 'images/vote-tally-light.png', dest: 'images/vote-tally-light.png'},
  {key: 'images/vote-tally-dark.png', dest: 'images/vote-tally-dark.png'},
  // The default social preview card (see OG_CARD in common/hosting/constants.ts). The filename is
  // versioned because WhatsApp and X cache a preview by URL and never revalidate it — a redesign
  // ships as -v2 on both sides, it never overwrites -v1.
  {key: 'images/og-card-v1.jpg', dest: 'images/og-card-v1.jpg'},
  // Martin's share-or-donate ask (docs/share-prompt.md). ~50 MB, so web-only: the apps stream it from
  // the deployed site rather than carrying it in the bundle. Upload to R2 before enabling this line.
  {key: 'videos/share-ask-v1.mp4', dest: 'videos/share-ask-v1.mp4', webOnly: true},
]

/**
 * The native build (`scripts/build_web_view.sh`, NEXT_PUBLIC_WEBVIEW=1) skips web-only assets: they
 * are served from the deployed site to every platform, and pulling them here would only put them in
 * the app packages.
 */
const WEBVIEW_BUILD = process.env.NEXT_PUBLIC_WEBVIEW === '1'
const NEEDED = ASSETS.filter((a) => !(WEBVIEW_BUILD && a.webOnly))

/**
 * On Vercel this comes from the project env. Locally it does not: this script runs in its own
 * process before `next build`, so Next's own .env loading has not happened yet. Read the two .env
 * files directly — just this one key, to avoid pulling unrelated secrets into the build process.
 */
async function resolveBase() {
  if (process.env.MEDIA_SOURCE_BASE_URL) return process.env.MEDIA_SOURCE_BASE_URL
  for (const envPath of [join(HERE, '../.env'), join(HERE, '../../.env')]) {
    try {
      const match = (await readFile(envPath, 'utf8')).match(/^MEDIA_SOURCE_BASE_URL=(.+)$/m)
      if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    } catch {
      // no .env there; try the next one
    }
  }
  return ''
}

const exists = async (p) => {
  try {
    return (await stat(p)).size > 0
  } catch {
    return false
  }
}

async function download({key, dest}, base) {
  const url = `${base}/${key}`
  const target = join(PUBLIC_DIR, dest)
  await mkdir(dirname(target), {recursive: true})

  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`)
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(target))
  const {size} = await stat(target)
  console.log(`[media] ${dest} (${(size / 1024).toFixed(0)} KB)`)
}

async function main() {
  const base = (await resolveBase()).replace(/\/$/, '')

  if (!base) {
    // No source configured: only acceptable if a local render already put the files in place.
    const present = await Promise.all(NEEDED.map((a) => exists(join(PUBLIC_DIR, a.dest))))
    if (present.every(Boolean)) {
      console.log('[media] MEDIA_SOURCE_BASE_URL unset; using the local files already in public/')
      return
    }
    const missing = NEEDED.filter((_, i) => !present[i]).map((a) => a.dest)
    throw new Error(
      `MEDIA_SOURCE_BASE_URL is unset and these are missing from public/:\n` +
        missing.map((m) => `  - ${m}`).join('\n') +
        `\nNothing about the home-page hero is committed, so this build would ship an empty frame. ` +
        `Set MEDIA_SOURCE_BASE_URL to the bucket's public base URL (it is not a secret), or render ` +
        `locally with media-creator.`,
    )
  }

  // Configured but unreachable is a real misconfiguration, and shipping a hero that 404s is worse
  // than failing the deploy.
  for (const asset of NEEDED) await download(asset, base)
}

main().catch((err) => {
  console.error(`[media] ${err.message}`)
  process.exit(1)
})
