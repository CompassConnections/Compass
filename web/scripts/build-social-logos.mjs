/**
 * Regenerates the Instagram, Liberapay and Ko-fi marks in public/images/, used by the email footer
 * (backend/email/emails/utils.tsx) and committed alongside the older logos in that folder.
 *
 * Not part of the build — the PNGs are committed, and this only needs re-running when a brand
 * refreshes its mark or we want a different size. Run it with `yarn --cwd=web build-social-logos`.
 *
 * The geometry comes from simple-icons at a pinned version rather than hand-traced paths, so the
 * shapes are the official ones. simple-icons ships every mark as a single monochrome path, which is
 * only half the story for two of these three, hence the per-icon notes below.
 *
 * The five older logos in public/images/ (github, discord, x, patreon, paypal) predate this script
 * and are left alone — they are already the correct full-colour marks and re-rendering them from a
 * monochrome source would be a downgrade.
 */

import {Buffer} from 'node:buffer'
import {readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(HERE, '../public/images')

/** Pinned: an unpinned `latest` would let a brand-refresh land silently on the next run. */
const SIMPLE_ICONS_VERSION = '16.28.0'

/** Matches the existing logos in public/images/ — full-bleed, transparent, retina-safe at 24px. */
const SIZE = 512

/**
 * `render` receives the icon's path data and returns the SVG body to rasterise. Splitting it out
 * per icon is what lets Instagram be a gradient and Liberapay be two layers.
 */
const ICONS = [
  {
    slug: 'instagram',
    file: 'instagram-logo.png',
    // The official mark is a gradient. A flat #E4405F silhouette is a recognisably wrong Instagram
    // logo, so the five brand stops run corner to corner across the glyph.
    render: (d) => `
      <defs>
        <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#FEDA75"/>
          <stop offset="0.25" stop-color="#FA7E1E"/>
          <stop offset="0.5" stop-color="#D62976"/>
          <stop offset="0.75" stop-color="#962FBF"/>
          <stop offset="1" stop-color="#4F5BD5"/>
        </linearGradient>
      </defs>
      <path fill="url(#ig)" d="${d}"/>`,
  },
  {
    slug: 'liberapay',
    file: 'liberapay-logo.png',
    // The glyph is a hole punched through the square, so filling the path alone would let whatever
    // is behind the icon show through the letters — white in a light email, near-black in a dark
    // one. The rect underneath supplies the black-on-yellow the real icon has, in both.
    render: (d) => `
      <rect x="0" y="0" width="24" height="24" rx="2.32" ry="2.32" fill="#1A171B"/>
      <path fill="#F6C915" d="${d}"/>`,
  },
  {
    slug: 'kofi',
    file: 'kofi-logo.png',
    // Single-colour by design: the cup outline and the heart are the mark, and the cup interior is
    // meant to be empty rather than filled white.
    render: (d) => `<path fill="#FF5E5B" d="${d}"/>`,
  },
]

async function loadSharp() {
  try {
    return (await import('sharp')).default
  } catch {
    // sharp is not a declared dependency here — it arrives transitively via Next. That is fine for
    // a script run by hand a couple of times a year, but it means it can go missing.
    throw new Error('sharp is not installed. Run `yarn add -D sharp` in web/ and try again.')
  }
}

async function fetchIconPath(slug) {
  const url = `https://unpkg.com/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${slug}.svg`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${url} -> ${res.status} ${res.statusText}`)
  }
  const svg = await res.text()
  const match = svg.match(/<path d="([^"]+)"/)
  if (!match) {
    throw new Error(`No path data in ${url}`)
  }
  return match[1]
}

async function main() {
  const sharp = await loadSharp()

  for (const {slug, file, render} of ICONS) {
    const d = await fetchIconPath(slug)
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ` +
      `width="${SIZE}" height="${SIZE}">${render(d)}</svg>`

    const png = await sharp(Buffer.from(svg), {density: 384})
      .resize(SIZE, SIZE, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
      .png()
      .toBuffer()

    const dest = join(OUT_DIR, file)
    // Rewriting an identical PNG would show up as a binary diff for no reason.
    const existing = await readFile(dest).catch(() => null)
    if (existing?.equals(png)) {
      console.log(`unchanged ${file}`)
      continue
    }
    await writeFile(dest, png)
    console.log(`wrote     ${file}`)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
