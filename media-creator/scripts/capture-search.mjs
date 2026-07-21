/**
 * Captures the mobile hero clip for the home page (H1 in docs/marketing-visuals.md).
 *
 * The story, end to end, in one real session: filter to women → type "meditation" → the list narrows
 * → open the first profile → scroll it → tap through to contacting her. That covers both halves of the
 * pitch (keyword search *and* filtering) plus the payoff, which a static grid shot cannot.
 *
 * Mobile rather than desktop, deliberately. A desktop capture renders at ~390 CSS px on a phone, which
 * puts the app's 14px type at about 5px — unreadable for what is likely most of the traffic. The mobile
 * capture is legible on a phone at natural scale and still fine on desktop inside a device frame.
 *
 * Every frame is a screenshot of the live app, and the typing and scrolling are captured step by step
 * rather than animated in Remotion — so the result count updates on the app's own debounce schedule and
 * the clip can never drift from what the product actually does.
 *
 * Each frame carries its own `hold` (in video frames) so the Remotion scene is a dumb sequencer: the
 * pacing decisions live here, next to the interaction they describe.
 *
 * No hand-made login needed. `SHOWCASE=1` seeding creates viewer@compass.showcase and this signs in as
 * it headlessly, so the whole thing runs unattended.
 *
 * Prerequisites:
 *   yarn dev                      # from the repo root — needs http://localhost:3000
 *   SHOWCASE=1 ./scripts/seed.sh  # showcase personas + the viewer account
 *
 * Usage:
 *   npm run capture:search        # light theme
 *   npm run capture:search:dark   # dark theme
 *   npm run capture:search -- --query climbing --theme dark
 *
 * Borrows Playwright from the monorepo root by absolute path, deliberately — this package stays
 * Remotion-only. Same trick as capture-profile.mjs.
 */

import {mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import pw from '../../node_modules/@playwright/test/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const SEARCH_DIR = join(HERE, '../public/search')

const BASE = 'http://localhost:3000'
const VIEWER_EMAIL = 'viewer@compass.showcase'
const VIEWER_PASSWORD = 'showcase-viewer-pass'

// iPhone-13 logical size. DPR 2 rather than the device's 3: it still out-resolves any place the clip
// is displayed, and it keeps the video canvas (780x1688) half the pixels to encode.
const VIEWPORT = {width: 390, height: 844}
const SCALE = 2

const args = process.argv.slice(2)
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

// "meditation" is the keyword the home-page copy names, so clip and text agree. It also matches two
// people for different reasons — Priya on her visible Meditation chip, Sofia only through her bio
// prose — which shows the search reads bios, not just tags.
const QUERY = argOf('query', 'meditation')

/**
 * Which theme to shoot. The app defaults to `auto`, so Playwright's colorScheme is enough to flip it —
 * no localStorage seeding needed. Each theme gets its own frame directory and manifest, and the page
 * picks between them at runtime.
 */
const THEME = argOf('theme', 'light')
if (THEME !== 'light' && THEME !== 'dark') {
  throw new Error(`--theme must be "light" or "dark", got "${THEME}"`)
}
const OUT_DIR = join(SEARCH_DIR, THEME)

// ─── Pacing (video frames @ 30fps) ──────────────────────────────────────────
const HOLD = {
  establish: 34, // the unfiltered list — the "before" everything else is measured against
  tap: 20, // a discrete tap landing
  panel: 34, // a panel or sheet that just appeared and needs reading
  keystroke: 4, // one typed character
  settle: 46, // the narrowed result — the frame people actually read
  // Many small steps rather than a few large ones. Seven 420px jumps held 14 frames each read as a
  // stutter — a lurch, then stillness — however long the total. 100px every 3 frames is ~33px/frame,
  // which is continuous motion at 30fps, and the whole scroll still lasts about the same 3 seconds.
  scroll: 3, // one scroll step
  finale: 60, // the contact action, held long enough to register as the payoff
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * First *visible* match for a locator.
 *
 * Both filter UIs are always in the DOM — the desktop rail and the mobile sheet — with one hidden by
 * `lg:` classes. Playwright's `.first()` is DOM order, not visibility, so on a phone viewport it
 * happily returns the hidden desktop control and then times out waiting for it to become clickable.
 */
async function firstVisible(locator, label) {
  const n = await locator.count()
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i)
    if (await el.isVisible().catch(() => false)) return el
  }
  throw new Error(`no visible element for ${label} (${n} hidden match(es))`)
}

async function main() {
  rmSync(OUT_DIR, {recursive: true, force: true})
  mkdirSync(OUT_DIR, {recursive: true})

  const browser = await pw.chromium.launch()
  const context = await browser.newContext({
    ...pw.devices['iPhone 13'],
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
    colorScheme: THEME,
    // The seeded copy is English-only; a stray locale would put half the UI in another language.
    locale: 'en-GB',
  })
  const page = await context.newPage()

  const shots = []

  /**
   * `tap` is the viewport position, in CSS px, of the control the user is about to press. The Remotion
   * scene draws a ripple there over the tail of this frame's hold — without it the UI just mutates
   * between shots for no visible reason and the clip is hard to follow.
   */
  /**
   * Park the virtual pointer somewhere inert before every frame.
   *
   * Playwright leaves the mouse wherever it last clicked, so whatever sits under that point stays in
   * its hover state for the rest of the run — after closing the filter sheet the pointer was resting on
   * a card's bookmark icon and its "Save Profile" tooltip hung over the results for the whole clip.
   * The top-left corner is page padding on every screen in the flow.
   */
  const parkPointer = () => page.mouse.move(2, 2)

  const shoot = async (kind, hold) => {
    await parkPointer()
    await page.waitForTimeout(120)
    const name = `frame-${pad(shots.length)}-${kind}.png`
    await page.screenshot({path: join(OUT_DIR, name)})
    shots.push({name, kind, hold})
  }

  /** Centre of a locator in viewport CSS px, for the tap indicator. */
  const centreOf = async (locator) => {
    const box = await locator.boundingBox()
    if (!box) return undefined
    return {x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2)}
  }

  /**
   * Click something, then capture the result.
   *
   * The tap marker is attached to the *previous* frame — the one still showing the pre-click state —
   * not to the frame the click produces. Clicking often reflows the page (selecting a gender inserts
   * the "Woman x" summary row and pushes everything down), so a position measured before the click
   * does not describe the frame after it, and the ripple lands on the wrong control. Marking the
   * before-frame is also the truthful order: press, then result.
   */
  const tapAndShoot = async (locator, kind, hold, settleMs = 900) => {
    const tap = await centreOf(locator)
    const previous = shots[shots.length - 1]
    if (tap && previous) previous.tap = tap
    await locator.click()
    await page.waitForTimeout(settleMs)
    await quieten()
    await shoot(kind, hold)
    return tap
  }

  // ── Sign in ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/signin`, {waitUntil: 'networkidle'})
  await page.fill('input[type="email"]', VIEWER_EMAIL)
  await page.fill('input[type="password"]', VIEWER_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, {timeout: 20000}).catch(() => {})
  await page.waitForTimeout(4000)
  if (page.url().includes('/signin')) {
    throw new Error(
      'still on /signin — is the viewer account seeded? Run: SHOWCASE=1 ./scripts/seed.sh',
    )
  }

  // ── Quieten the page ───────────────────────────────────────────────────────
  // The growth-phase banner is timely copy that would date the clip, and on a phone it costs a third
  // of the screen. Dismiss it rather than crop around it.
  const dismiss = page.getByText('Dismiss', {exact: true})
  if (await dismiss.count()) {
    await dismiss.first().click()
    await page.waitForTimeout(600)
  }

  // Animations off so no frame lands mid-transition; the dev badge lives in a shadow-DOM portal, so it
  // has to be killed by tag name.
  const quieten = () =>
    page.addStyleTag({
      content: `
        *, *::before, *::after { animation: none !important; transition: none !important; }
        nextjs-portal, #__next-build-watcher { display: none !important; }
      `,
    })
  await quieten()
  await page.waitForTimeout(1200)

  // ── 1. The unfiltered list ─────────────────────────────────────────────────
  await shoot('idle', HOLD.establish)

  // ── 2. Filter to women ─────────────────────────────────────────────────────
  // The filter rail collapses to a single icon button on mobile (`lg:hidden` in filters/search.tsx).
  const filterButton = await firstVisible(page.locator('button.lg\\:hidden'), 'filter button')
  await tapAndShoot(filterButton, 'filters-open', HOLD.panel)

  // Sections start collapsed, so gender has to be opened before "Woman" exists in the DOM. The header
  // is labelled by its current state ("Any gender" until something is picked), not by the field name.
  const genderSection = await firstVisible(page.getByText(/gender$/i), 'gender section header')
  await tapAndShoot(genderSection, 'gender-open', HOLD.panel)

  const woman = await firstVisible(page.getByText('Woman', {exact: true}), 'Woman option')
  await woman.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await tapAndShoot(woman, 'filter-woman', HOLD.panel, 1800)

  // Close the sheet to reveal what the filter did. Escape is the reliable route — the close affordance
  // moves around, and a stray click can land on a filter.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1600)
  await quieten()
  await shoot('filtered', HOLD.settle)

  // ── 3. Type the keyword ────────────────────────────────────────────────────
  const box = await firstVisible(page.locator('input[placeholder*="Search"]'), 'search box')
  await tapAndShoot(box, 'focus', HOLD.tap, 400)

  for (const char of QUERY) {
    await box.press(char === ' ' ? 'Space' : char)
    await page.waitForTimeout(130)
    await shoot(`type-${char}`, HOLD.keystroke)
  }

  await page.waitForTimeout(2500)
  await shoot('result', HOLD.settle)

  const count = await page
    .locator('text=/\\d+ (people|person)/')
    .first()
    .textContent()
    .catch(() => null)

  // ── 4. Open the first profile ──────────────────────────────────────────────
  // Target the result card's name heading rather than the first anchor on the page. The first anchor
  // is the visually-hidden "Skip to main content" link: clicking it still ends up navigating, so the
  // flow looked fine, but it has no bounding box, so the tap indicator silently went missing.
  // Reading the name off the card also avoids hardcoding a person, since --query decides who matches.
  const cardHeading = await firstVisible(
    page.getByRole('heading').filter({hasNotText: /^People$/}),
    'first result card heading',
  )
  const firstName = (await cardHeading.textContent())?.trim()
  const cardTap = await centreOf(cardHeading)
  if (cardTap) shots[shots.length - 1].tap = cardTap
  await cardHeading.click({timeout: 10000})
  // Wait for the profile to actually be there rather than guessing at a duration. A fixed timeout is
  // hostage to however long the dev server takes to compile the route: when it ran long, the first
  // frames caught the results list mid-navigation with the card greyed out, and the "scroll the
  // profile" beat opened on the wrong page entirely.
  await page.waitForURL((url) => url.pathname !== '/', {timeout: 25000})
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  await quieten()
  await shoot('profile-top', HOLD.panel)
  console.log(`opened profile: ${firstName ?? 'unknown'}`)

  // ── 5. Scroll the profile ──────────────────────────────────────────────────
  const SCROLL_STEPS = 30
  const SCROLL_STEP_PX = 100
  for (let i = 0; i < SCROLL_STEPS; i++) {
    await page.mouse.wheel(0, SCROLL_STEP_PX)
    await page.waitForTimeout(90)
    await shoot(`profile-scroll-${i}`, HOLD.scroll)
  }

  // ── 6. Contact her ─────────────────────────────────────────────────────────
  // Opens the compose UI only. Nothing is ever sent: no submit is clicked, and the account is a
  // fictional showcase persona regardless.
  const contact = page.getByText(/thoughtful message/i).first()
  if (await contact.count()) {
    // Centre it rather than scrollIntoViewIfNeeded: that stops as soon as the button is technically
    // in the viewport, which parks it flush against the bottom edge underneath the fixed nav bar —
    // so the button is barely visible and the tap ripple lands on the nav instead of on it.
    await contact.evaluate((el) => el.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(700)
    await quieten()
    await shoot('contact-visible', HOLD.panel)

    await tapAndShoot(contact, 'contact-open', HOLD.finale, 2000)
  } else {
    console.warn(
      'warning: no "Send them a thoughtful message" button found — clip ends on the scroll',
    )
    await shoot('profile-end', HOLD.finale)
  }

  await browser.close()

  const durationInFrames = shots.reduce((sum, s) => sum + s.hold, 0)
  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        query: QUERY,
        theme: THEME,
        capturedAt: new Date().toISOString(),
        viewport: {width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE},
        cssViewport: VIEWPORT,
        scale: SCALE,
        resultCount: count,
        durationInFrames,
        frames: shots,
      },
      null,
      2,
    ) + '\n',
  )

  console.log(`captured ${shots.length} ${THEME} frames -> media-creator/public/search/${THEME}/`)
  console.log(`query "${QUERY}" (women, ${THEME}) settled on: ${count ?? 'unknown'}`)
  console.log(`clip length: ${durationInFrames} frames (${(durationInFrames / 30).toFixed(1)}s)`)

  const matched = Number(count?.match(/^(\d+)/)?.[1] ?? NaN)
  if (matched === 0) {
    console.warn(`warning: "${QUERY}" matched nothing — is the showcase seed loaded?`)
  } else if (matched > 4) {
    console.warn(`warning: "${QUERY}" matched ${count}; too many to read as a narrowing.`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
