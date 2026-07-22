/**
 * Captures a real proposal card from /vote for the about page (A1 in docs/marketing-visuals.md).
 *
 * The about page asserts that members govern the project and links to /vote in plain text. One card
 * showing a contested ballot that ended in `Implemented ✔️` converts that assertion into evidence:
 * proposal → vote → shipped, verifiable by the reader.
 *
 * Captured against **production**, not a local seed, because the entire point is that this is a real
 * decision. /vote renders for logged-out visitors (`web/pages/vote.tsx` only gates on
 * `user === undefined`), so no auth is involved and nothing private is on screen — the tally is
 * aggregate counts and the proposer's name, both already public on that page.
 *
 * Only the single card element is shot, never the viewport, so no neighbouring proposal or member
 * name can wander into frame.
 *
 * Usage:
 *   npm run capture:vote          # both themes
 *   npm run capture:vote -- --title "Require email verification" --base http://localhost:3000
 *
 * Re-run after any restyle of `web/components/votes/vote-item.tsx`. The tally will have moved on by
 * then, which is fine and in fact the point — it is a screenshot, not a claim frozen in a PNG.
 *
 * Borrows Playwright from the monorepo root by absolute path, deliberately — this package stays
 * Remotion-only. Same trick as capture-search.mjs.
 */

import {mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import pw from '../../node_modules/@playwright/test/index.js'
import sharp from '../../node_modules/sharp/lib/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
// Straight into web/public: these are small stills, not Remotion inputs, so they need no render step.
const OUT_DIR = join(HERE, '../../web/public/images')

const args = process.argv.slice(2)
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const BASE = argOf('base', 'https://compassmeet.com')

/**
 * Which proposal to shoot, matched on a prefix of its title.
 *
 * Chosen over the alternatives on the page because it is the one that best evidences the claim:
 * contested (11 For / 1 Against — a unanimous tally reads as ceremonial), a governance and safety
 * decision rather than a UX tweak, and `Implemented ✔️` rather than `Voting Open`, so it shows the
 * vote actually decided something. A reader can verify the outcome by trying to message someone from
 * an unverified account.
 */
const TITLE = argOf('title', 'Require email verification')

/**
 * Two widths, not one, for the same reason H1 is captured on mobile: a 900px-wide card shown in a
 * ~350px phone column is scaled to about 44%, which puts the card's 14px description at ~6px. The
 * narrow capture lets the card reflow into its own mobile layout and is then displayed at 1:1.
 *
 * The page picks between them with a `<picture>` media query, so only one is ever downloaded.
 */
const WIDTHS = [
  // Wide enough that the description stays on few lines and the tally sits on one row, without the
  // card reflowing into its narrow layout.
  {suffix: '', viewport: {width: 900, height: 1000}},
  // iPhone-13 logical width, matching capture-search.mjs.
  {suffix: '-narrow', viewport: {width: 390, height: 844}},
]
const SCALE = 2

async function capture(browser, theme, {suffix, viewport}) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: SCALE,
    // The app resolves the manual toggle and the system preference into the `dark` class on <html>
    // (see web/public/init-theme.js). With no stored preference the default is 'auto', so emulating
    // the media query is enough — no localStorage seeding needed.
    colorScheme: theme,
  })
  const page = await ctx.newPage()

  await page.goto(`${BASE}/vote`, {waitUntil: 'networkidle', timeout: 60000})

  // The card is `Col.mb-4.rounded-lg.border` wrapping a `p.text-2xl` title
  // (web/components/votes/vote-item.tsx). Match on the title, then climb to the card.
  const heading = page.locator('p.text-2xl', {hasText: TITLE}).first()
  await heading.waitFor({state: 'visible', timeout: 30000})
  const card = heading.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]')

  // Let webfonts settle before shooting, or the text reflows a fraction after the screenshot.
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  // WebP, not JPEG. The card is flat fill and text, which is what JPEG handles worst — the same shot
  // is about 45% smaller here (80 KB vs 145 KB). That matters because the page needs a <picture> to
  // choose a width, and next/image cannot emit one, so these are served unoptimised as authored.
  const out = join(OUT_DIR, `vote-tally-${theme}${suffix}.webp`)
  const png = await card.screenshot({type: 'png', scale: 'device'})
  const {size} = await sharp(png).webp({quality: 82}).toFile(out)

  const {width, height} = await card.boundingBox()
  const status = await card.innerText()
  console.log(
    `[vote] ${theme}${suffix}: ${out} (${width}x${height} css, ${(size / 1024).toFixed(0)} KB)`,
  )
  if (!/Implemented/i.test(status)) {
    console.warn(
      `[vote] WARNING: the captured card no longer reads "Implemented". The about page copy ` +
        `describes it as a shipped decision — check web/pages/about.tsx before publishing.`,
    )
  }

  await ctx.close()
}

const browser = await pw.chromium.launch()
try {
  mkdirSync(OUT_DIR, {recursive: true})
  console.log(`[vote] capturing "${TITLE}" from ${BASE}/vote`)
  for (const theme of ['light', 'dark']) {
    for (const width of WIDTHS) await capture(browser, theme, width)
  }
} finally {
  await browser.close()
}
