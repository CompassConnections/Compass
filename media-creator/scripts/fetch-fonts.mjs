/**
 * Downloads the brand web faces into public/fonts/ for the OG card render.
 *
 * The files are not committed (see .gitignore) — the same call the repo makes for the hero clips
 * and for public/logo.svg. They are build *inputs* though, not outputs, so they come from Google
 * Fonts rather than from R2: no credentials, and nothing to upload when a face changes.
 *
 * Resolved through the css2 API rather than hardcoded gstatic URLs on purpose. Those URLs carry a
 * family version (`/newsreader/v26/`) that Google rotates, so a hardcoded list rots silently; the
 * API always answers with the current one.
 *
 *   npm run fonts            # no-op if the files are already there
 *   npm run fonts -- --force # re-download, e.g. to pick up a new family version
 *
 * `npm run still:og` runs this first, so rendering the card needs no separate step. Run it by hand
 * before `npm run studio` if you want to preview the card there.
 *
 * Only Newsreader, DM Sans and Cormorant Garamond are fetched, and only their `latin` subset —
 * that is all the card sets. The video scenes deliberately use the system stack instead.
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const FONT_DIR = join(HERE, '../public/fonts')

// A desktop UA is what makes the API answer with woff2; older agents get ttf.
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/**
 * Filenames are what src/components/BrandFonts.ts loads — keep the two in sync.
 *
 * Every family here is variable, so one file per style covers the whole weight range and the
 * weights in the query only decide which axes Google keeps.
 */
const FONTS = [
  {
    file: 'Newsreader-latin.woff2',
    family: 'Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700',
    style: 'normal',
  },
  {
    file: 'Newsreader-Italic-latin.woff2',
    family: 'Newsreader:ital,opsz,wght@1,6..72,400',
    style: 'italic',
  },
  {
    file: 'DMSans-latin.woff2',
    family: 'DM+Sans:opsz,wght@9..40,400;9..40,500',
    style: 'normal',
  },
  {
    file: 'CormorantGaramond-500-latin.woff2',
    family: 'Cormorant+Garamond:wght@500',
    style: 'normal',
  },
]

const force = process.argv.includes('--force')

const exists = async (path) => {
  try {
    return (await readFile(path)).byteLength > 0
  } catch {
    return false
  }
}

/**
 * Pulls the `latin` @font-face of the requested style out of a css2 response.
 *
 * The API returns one block per subset, each preceded by a `/* subset *\/` comment — that comment
 * is the only thing identifying them, so the parse keys off it.
 */
function findLatinSrc(css, style) {
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)]

  for (const [, subset, body] of blocks) {
    if (subset !== 'latin') continue
    const blockStyle = body.match(/font-style:\s*([\w]+)/)?.[1] ?? 'normal'
    if (blockStyle !== style) continue
    const url = body.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1]
    if (url) return url
  }
  return null
}

async function fetchFont({file, family, style}) {
  const target = join(FONT_DIR, file)

  if (!force && (await exists(target))) {
    console.log(`[fonts] ${file} — already present`)
    return
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
  const cssRes = await fetch(cssUrl, {headers: {'User-Agent': UA}})
  if (!cssRes.ok) {
    throw new Error(`${cssRes.status} ${cssRes.statusText} for ${cssUrl}`)
  }

  const src = findLatinSrc(await cssRes.text(), style)
  if (!src) {
    throw new Error(`No latin ${style} woff2 in the css2 response for ${family}`)
  }

  const fontRes = await fetch(src, {headers: {'User-Agent': UA}})
  if (!fontRes.ok) {
    throw new Error(`${fontRes.status} ${fontRes.statusText} for ${src}`)
  }

  const bytes = Buffer.from(await fontRes.arrayBuffer())
  // Guard against a redirect or an error page landing on disk as a .woff2: the render would fail
  // much further away from the cause.
  if (bytes.subarray(0, 4).toString('ascii') !== 'wOF2') {
    throw new Error(`${src} did not return a woff2 file`)
  }

  await writeFile(target, bytes)
  console.log(`[fonts] ${file} (${(bytes.byteLength / 1024).toFixed(0)} KB)`)
}

async function main() {
  await mkdir(FONT_DIR, {recursive: true})
  for (const font of FONTS) await fetchFont(font)
}

main().catch((err) => {
  console.error(`[fonts] ${err.message}`)
  console.error('[fonts] The OG card cannot render without these — see media-creator/README.md.')
  process.exit(1)
})
