// Captures the artwork the profile videos are built from.
//
// Shoots the public profile page at a phone-sized viewport (430×932 CSS px @ DPR 2,
// so every PNG is 2× and stays crisp on the 1080-wide canvas) and writes, per profile:
// one clip per section (the profile-tour video), the whole page as full.png (the
// profile-scroll video), and manifest.json — the page's measurements, so the scroll
// video never carries hard-coded pixel values for one particular profile.
//
// Output goes to public/profile-<username>/ unless --out says otherwise; the tour's
// artwork lives in public/profile/, which is what `npm run capture:profile` passes.
//
// Playwright lives in the monorepo root, NOT in this standalone package — this
// script reaches for it by absolute path on purpose, so `npm install` here stays
// Remotion-only. Run it from the repo root with a dev server up:
//
//   yarn dev                                    # http://localhost:3000
//   node media-creator/scripts/capture-profile.mjs [profileUrl]
//
// Compatibility Prompts and Endorsements only render for a signed-in viewer, so
// capturing them needs a session. Firebase keeps its auth in IndexedDB, which
// Playwright's storageState does NOT carry — hence a persistent browser profile
// you sign into by hand, once:
//
//   node media-creator/scripts/capture-profile.mjs --login
//
// That opens a real window; sign in yourself, and the session is kept in
// .auth-profile/ (gitignored) for every later headless run.
import {existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import pw from '../../node_modules/@playwright/test/index.js'

const {chromium} = pw

const HERE = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const LOGIN = args.includes('--login')
// --out <dir> writes elsewhere under public/, so capturing a second profile doesn't
// overwrite the artwork the profile-tour video is built from. Last one wins, because
// `npm run capture:profile` passes `--out profile` itself and a hand-typed --out has to
// be able to override it.
const outAt = args.lastIndexOf('--out')
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out')
const PAGE_URL = positional[0] ?? 'http://localhost:3000/Martin'
// The scroll video addresses its artwork by username — public/profile-<username>/ — so
// that pointing it at someone else is a render argument rather than a source edit.
const USERNAME = decodeURIComponent(
  new URL(PAGE_URL).pathname.split('/').filter(Boolean).pop() ?? '',
)
const OUT_NAME = outAt === -1 ? `profile-${USERNAME}` : args[outAt + 1]
const OUT_DIR = join(HERE, '..', 'public', OUT_NAME)
const PROFILE_DIR = join(HERE, '..', '.auth-profile')

// Everything measured off the DOM is in CSS px; the PNGs are shot at DPR 2. The video
// works in source-PNG px, so measurements are scaled on the way into the manifest.
const DPR = 2

// Card title -> output file. Titles come from the ProfileCard headings in
// web/components/profile/profile-info.tsx. The last two need a signed-in
// session; without one they simply aren't in the DOM and are skipped.
const CARDS = [
  ['Details', '02-details.png'],
  ['Interests', '03-interests.png'],
  ['Personality', '04-personality.png'],
  ['Links', '05-links.png'],
  ['About Me', '06-bio.png'],
  ['Compatibility Prompts', '08-prompts.png'],
  ['Endorsements', '09-endorsements.png'],
]

const PAD = 12 // CSS px of breathing room around each clip

mkdirSync(OUT_DIR, {recursive: true})

// One persistent context for both modes, so --login and the captures share a
// session. Headed only while logging in.
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: !LOGIN,
  viewport: {width: 430, height: 932},
  deviceScaleFactor: 2,
  colorScheme: 'light',
})
const page = context.pages()[0] ?? (await context.newPage())

if (LOGIN) {
  console.log('\nA browser window is open. Sign in there yourself — this script never')
  console.log('handles your credentials. It waits until you land back on a signed-in page.\n')
  await page.goto('http://localhost:3000/signin', {timeout: 60000})
  await page.waitForURL((u) => !u.pathname.includes('signin'), {timeout: 300000})
  await page.waitForTimeout(3000)
  await context.close()
  console.log(`Session saved to ${PROFILE_DIR}. Re-run without --login to capture.`)
  process.exit(0)
}

if (!existsSync(join(PROFILE_DIR, 'Default'))) {
  console.log('No saved session — prompts and endorsements will be skipped.')
  console.log('Run with --login once to capture them.\n')
}

await page.goto(PAGE_URL, {waitUntil: 'networkidle', timeout: 60000})
await page.waitForSelector('[data-testid="profile-content"]', {timeout: 30000})
// Photos are lazy next/image — walk the page top to bottom so every one of them
// starts loading, then come back up and let them decode.
await page.evaluate(async () => {
  const step = innerHeight * 0.8
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 150))
  }
  scrollTo(0, 0)
})
await page.waitForTimeout(2500)

// Anything pinned to the viewport (bottom nav, sticky top bar, sign-up CTA) would
// smear across a full-page capture — hide it, plus the CSS animations.
// The Next.js dev-tools badge lives in a shadow-DOM portal, so the sweep below
// can't see it — kill it by tag name instead.
await page.addStyleTag({
  content: `
    *, *::before, *::after { animation: none !important; transition: none !important; }
    nextjs-portal, #__next-build-watcher { display: none !important; }
  `,
})
await page.evaluate(() => {
  for (const el of document.querySelectorAll('body *')) {
    const pos = getComputedStyle(el).position
    if (pos === 'fixed' || pos === 'sticky') el.style.display = 'none'
  }
})

// Absolute page rect for a node, padded, clamped to the document.
const rectOf = (selectorFn, arg) =>
  page.evaluate(
    ([fn, a, pad]) => {
      const el = new Function('a', `return (${fn})(a)`)(a)
      if (!el) return null
      const r = el.getBoundingClientRect()
      const x = Math.max(0, r.left + scrollX - pad)
      const y = Math.max(0, r.top + scrollY - pad)
      return {
        x,
        y,
        width: Math.min(r.width + pad * 2, document.documentElement.scrollWidth - x),
        height: r.height + pad * 2,
      }
    },
    [selectorFn.toString(), arg, PAD],
  )

const shoot = async (file, clip) => {
  if (!clip) {
    console.warn(`  ✗ ${file} — element not found, skipped`)
    return
  }
  const path = join(OUT_DIR, file)
  await page.screenshot({path, fullPage: true, clip})
  console.log(`  ✓ ${file}  ${Math.round(clip.width)}×${Math.round(clip.height)} CSS px`)
}

// 1 — header: avatar, name, location, chips, pull-quote.
await shoot('01-header.png', await rectOf(() => document.querySelector('.animate-profile-appear')))

// 2..6 — one card per section, found by its heading text.
for (const [title, file] of CARDS) {
  await shoot(
    file,
    await rectOf((t) => {
      const cards = [...document.querySelectorAll('.bg-canvas-50.border-canvas-300.border')]
      return cards.find((c) => c.innerText.trim().startsWith(t))
    }, title),
  )
}

// 7 — photo carousel. Grab the scrolling row, not one slide: the clip is clamped
// to the page width, so it frames photo 1 with photo 2 peeking in — as in the app.
await shoot(
  '07-photos.png',
  await rectOf(() => document.querySelector('.snap-start')?.closest('[class*="overflow"]') ?? null),
)

// 8 — the whole page, for the establishing slow-scroll shot.
const full = await page.screenshot({fullPage: true})
writeFileSync(join(OUT_DIR, 'full.png'), full)
// Straight out of the PNG's IHDR chunk (width at byte 16, height at 20) rather than out
// of the DOM: this is the one number the video cannot be wrong about, and Playwright's
// full-page stitching can round differently than scrollHeight × DPR would suggest.
const fullSize = {w: full.readUInt32BE(16), h: full.readUInt32BE(20)}
console.log(`  ✓ full.png  ${fullSize.w}×${fullSize.h} px (full page, for the scroll shot)`)

// 9 — the manifest the ProfileScrollStory video reads instead of hard-coded pixel
// values: the page's size, where its content starts, and where each section sits.
// Measured here because this is where the live DOM is, so the video never has to be
// re-measured by hand after a profile-UI change — or when pointed at another profile.
//
// Sections are found by their heading, not by a card wrapper: the profile page is prose
// with small-caps labels, and which blocks are boxed has changed more than once
// (`SectionHeading` in web/components/profile/section.tsx is the h2 both the reading
// column and the attribute rail head their blocks with).
const measurements = await page.evaluate(() => {
  const rect = (el) => {
    const r = el.getBoundingClientRect()
    return {y: r.top + scrollY, h: r.height}
  }
  const header = document.querySelector('.animate-profile-appear')
  // Scoped to the profile grid so a heading in the page's own furniture — footer,
  // language switcher, sign-up CTA — can never become a resting point.
  const scope = document.querySelector('[data-testid="profile-content"]') ?? document
  return {
    // Content starts at the header; the page's own top bar sits above it and is chrome,
    // not profile. 0 rather than the header's y if the header somehow isn't there —
    // better a top bar on screen than a crop into the middle of the face.
    contentTop: header ? rect(header).y : 0,
    sections: [...scope.querySelectorAll('h2')]
      .map((h) => {
        // textContent, not innerText: the headings are uppercased in CSS, and the video
        // matches them against source-cased titles ('About Me').
        const title = (h.textContent ?? '').trim()
        // The heading's y is the anchor — a stop rests with the label at the top of the
        // frame. The height is the whole block's, which is the more useful number if a
        // future beat ever wants to dwell in proportion to how much there is to read.
        const block = h.closest('section') ?? h.parentElement ?? h
        return {title, y: rect(h).y, h: rect(block).h}
      })
      .filter((s) => s.title)
      .sort((a, b) => a.y - b.y),
  }
})

const toSource = (n) => Math.round(n * DPR)
writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify(
    {
      username: USERNAME,
      url: PAGE_URL,
      full: fullSize,
      cropTop: toSource(measurements.contentTop),
      // The shot's own bottom edge. Lower it by hand if a page ends on dead space — the
      // clip's last beat should rest on content, not on blank canvas.
      cropBottom: fullSize.h,
      sections: measurements.sections.map((s) => ({
        title: s.title,
        y: toSource(s.y),
        h: toSource(s.h),
      })),
    },
    null,
    2,
  ) + '\n',
)
console.log(`  ✓ manifest.json  ${measurements.sections.length} sections`)

await context.close()
console.log(`\nWrote ${OUT_DIR}`)
console.log(`Render the scroll clip with:  npm run render:scroll ${USERNAME}`)
