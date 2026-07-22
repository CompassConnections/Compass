/**
 * Captures the saved-search alert loop for the about page (A4 in docs/marketing-visuals.md).
 *
 * The about page claims "Get Notified About Searches" and shows nothing. It is the hardest claim on
 * that page to evidence with a still, because the whole point of it is something that happens *later*:
 * you search, nobody fits, and days afterwards the platform tells you somebody does.
 *
 * The flow, in order:
 *   1. /people, filtered to man / 24-40 / atheist / vegan, near Grenoble
 *   2. no results — which is the honest reason to save a search, and the app's own empty state says so
 *   3. "Get notified for selected filters", and the saved-search modal confirming it
 *   4. the alert email that arrives (dissolved into — see SearchAlert.tsx on why there is no title card)
 *   5. the match's profile
 *   6. the composer
 *
 * Beats 1-3 and 5-6 are the live app. Beat 4 is the real email template rendered by
 * `yarn --cwd=backend/email render:alert`, shown in invented mail-client chrome — the one seam in the
 * clip, because the product has no mail surface of its own to photograph.
 *
 * Mobile for the same reason as the hero clip: at 390px the email's container (maxWidth 600px, no
 * fixed width) reflows fluid and stays legible at roughly 1:1, where a desktop capture scaled into a
 * phone column would be unreadable.
 *
 * Usage:
 *   npm run capture:alert         # light theme
 *   npm run capture:alert:dark    # dark theme
 *
 * Needs `yarn dev` running and the SHOWCASE=1 seed applied, including the `juliensarr` persona — he is
 * the only profile that matches this search, and without him beat 5 has nobody to open.
 *
 * Borrows Playwright from the monorepo root by absolute path, deliberately — this package stays
 * Remotion-only. Same trick as capture-search.mjs.
 */

import {execFileSync} from 'node:child_process'
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import pw from '../../node_modules/@playwright/test/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '../..')
const ALERT_DIR = join(HERE, '../public/alert')

const BASE = 'http://localhost:3000'
const VIEWER_EMAIL = 'viewer@compass.showcase'
const VIEWER_PASSWORD = 'showcase-viewer-pass'

/** The persona this search is built to find. See tests/e2e/utils/showcase-profiles.ts. */
const MATCH_SLUG = 'juliensarr'
const MATCH_NAME = 'Julien Sarr'

const VIEWPORT = {width: 390, height: 844}
const SCALE = 2

const args = process.argv.slice(2)
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const THEME = argOf('theme', 'light')
if (THEME !== 'light' && THEME !== 'dark') {
  throw new Error(`--theme must be "light" or "dark", got "${THEME}"`)
}
const OUT_DIR = join(ALERT_DIR, THEME)

/**
 * Which half of the clip to shoot.
 *
 * The two halves cannot be captured in one run, and not for a technical reason. The saved search has to
 * *match* Julien for the alert email to mean anything, and *not* match him for the "nobody fits this
 * yet" beat that motivates saving it at all. Both cannot be true of one database at one moment, so the
 * first half is shot while he does not exist and the second after he is seeded:
 *
 *   SHOWCASE_SKIP=juliensarr SHOWCASE=1 ./scripts/dev_db_seed.sh
 *   npm run capture:alert -- --phase before
 *   SHOWCASE=1 ./scripts/dev_db_seed.sh
 *   npm run capture:alert -- --phase after      # merges both halves into manifest.json
 *
 * Staging the empty state instead — hiding him from the results with the card's own hide control —
 * would have been one pass and a fiction, and an invisible one to anybody watching. This costs a seed
 * run and stays true.
 */
const PHASE = argOf('phase', 'before')
if (!['before', 'after'].includes(PHASE)) {
  throw new Error(`--phase must be "before" or "after", got "${PHASE}"`)
}
const PART_MANIFEST = (phase) => join(OUT_DIR, `frames-${phase}.json`)

// The city the location filter is set to. The viewer persona and the match both live here, so the
// beat cannot fail on wherever the radius slider happens to sit.
const CITY = argOf('city', 'Grenoble')

// ─── Pacing (video frames @ 30fps) ──────────────────────────────────────────
const HOLD = {
  establish: 34,
  tap: 20,
  panel: 34,
  empty: 50, // "no results" — needs long enough to register as a dead end, not a loading state
  settle: 46,
  email: 70, // the payoff of the first half; it is dense and people need to read it
  scroll: 3,
  // The two beats that prove the match. Long, because they are the only moments in the clip that are
  // meant to be *read* rather than watched: the viewer is checking five facts against five criteria.
  criteria: 96,
  finale: 60,
}

const pad = (n) => String(n).padStart(2, '0')

/**
 * First *visible* match for a locator.
 *
 * Both filter UIs are always in the DOM — desktop rail and mobile sheet — with one hidden by `lg:`
 * classes. Playwright's `.first()` is DOM order, not visibility, so on a phone viewport it returns the
 * hidden desktop control and then times out. Same helper, same reason, as capture-search.mjs.
 */
async function visibleMatches(locator) {
  const out = []
  const n = await locator.count()
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i)
    if (await el.isVisible().catch(() => false)) out.push(el)
  }
  return out
}

async function firstVisible(locator, label) {
  const found = await visibleMatches(locator)
  if (!found.length) {
    throw new Error(`no visible element for ${label} (${await locator.count()} hidden match(es))`)
  }
  return found[0]
}

async function main() {
  // Only the first phase clears the directory; the second has to find the first half's frames still
  // there to merge with.
  if (PHASE === 'before') rmSync(OUT_DIR, {recursive: true, force: true})
  mkdirSync(OUT_DIR, {recursive: true})

  // Rendered from the real template as part of the run rather than by hand, so the email and the frames
  // around it cannot drift apart — it is supposed to describe the very search just saved.
  const emailPath = join(tmpdir(), `compass-alert-${THEME}.html`)
  if (PHASE === 'after') {
    execFileSync('yarn', ['--cwd=backend/email', 'render:alert', emailPath, BASE, THEME], {
      cwd: REPO,
      stdio: 'inherit',
    })
  }

  const browser = await pw.chromium.launch()
  const context = await browser.newContext({
    ...pw.devices['iPhone 13'],
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
    colorScheme: THEME,
    locale: 'en-GB',
  })
  const page = await context.newPage()
  // Playwright's 30s default is not enough against a cold `next dev`: the first hit on a route pays
  // for compiling it, and this script visits several it has never touched. Same class of problem as
  // the fixed waits H1 had to replace with explicit conditions — don't let compile time decide
  // whether the capture succeeds.
  page.setDefaultNavigationTimeout(120000)
  page.setDefaultTimeout(45000)

  const shots = []
  // Hoisted: it is read in the `before` phase but written into the manifest at the end, outside it.
  let count = null

  const parkPointer = () => page.mouse.move(2, 2)

  const quieten = () =>
    page.addStyleTag({
      content: `
        *, *::before, *::after { animation: none !important; transition: none !important; }
        nextjs-portal, #__next-build-watcher { display: none !important; }
      `,
    })

  const shoot = async (kind, hold, extra = {}) => {
    await parkPointer()
    await page.waitForTimeout(120)
    // Phase-prefixed so the two runs cannot overwrite each other's frames. Playback order comes from
    // the manifest, not from these names.
    const name = `${PHASE}-${pad(shots.length)}-${kind}.png`
    await page.screenshot({path: join(OUT_DIR, name)})
    shots.push({name, kind, hold, ...extra})
  }

  const centreOf = async (locator) => {
    const box = await locator.boundingBox()
    if (!box) return undefined
    return {x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2)}
  }

  /**
   * Click something, then capture the result. The tap marker goes on the *previous* frame — the one
   * still showing the pre-click state — because clicking reflows the page, so a position measured
   * before the click does not describe the frame after it. Press, then result.
   */
  const tapAndShoot = async (locator, kind, hold, settleMs = 900) => {
    const tap = await centreOf(locator)
    const previous = shots[shots.length - 1]
    if (tap && previous) previous.tap = tap
    await locator.click()
    await page.waitForTimeout(settleMs)
    await quieten()
    await shoot(kind, hold)
  }

  /**
   * Set one filter: open its group if it has one, open its section, then pick the option.
   *
   * Most filters are nested. `FilterGroup` renders `{isOpen && children}`, so a collapsed group keeps
   * its sections out of the DOM entirely — not merely hidden — and looking for "Religion" before
   * opening "Values & Beliefs" finds nothing at all. Only gender and location sit at the top level.
   *
   * Both groups and sections are accordions (`openGroup === title` / `openFilter == title`), so each
   * of these closes the previous one. That is fine: the *selections* persist, and the closing is
   * visible in the clip as the rail folding back up, which reads as progress through a form.
   */
  /**
   * The filter controls to drive: the mobile sheet if it is open, otherwise the page.
   *
   * Both filter UIs are always mounted — the desktop rail and the mobile sheet — and `firstVisible`
   * alone is not enough to tell them apart, because the desktop rail is not reliably `display: none`
   * at this viewport. It is merely behind the sheet, so Playwright calls it visible, clicks it, and
   * then times out with the sheet's own overlay "intercepting pointer events". Scoping every query to
   * the sheet's portal removes the ambiguity instead of guessing at it.
   */
  const panel = () => {
    const portal = page.locator('#headlessui-portal-root')
    return portal
  }

  const pickFilter = async (group, sectionRe, optionText, kind) => {
    const root = panel()
    if (group) {
      const groupHeader = await firstVisible(
        root.getByRole('button').filter({hasText: group}),
        `${group} group header`,
      )
      await groupHeader.evaluate((el) => el.scrollIntoView({block: 'center'}))
      await page.waitForTimeout(250)
      await tapAndShoot(groupHeader, `${kind}-group`, HOLD.tap, 600)
    }

    const section = await firstVisible(root.getByText(sectionRe), `${kind} section header`)
    await section.evaluate((el) => el.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(250)
    await tapAndShoot(section, `${kind}-open`, HOLD.tap, 600)

    const option = await firstVisible(root.getByText(optionText, {exact: true}), `${kind} option`)
    await option.evaluate((el) => el.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(250)
    await tapAndShoot(option, `${kind}-set`, HOLD.panel, 1200)
  }

  // ── Sign in ────────────────────────────────────────────────────────────────
  // Both phases need a session: the first to search and save, the second because the profile grid and
  // the composer only render for a signed-in user.
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

  const dismiss = page.getByText('Dismiss', {exact: true})
  if (await dismiss.count()) {
    await dismiss.first().click()
    await page.waitForTimeout(600)
  }
  await quieten()
  await page.waitForTimeout(1200)

  if (PHASE === 'before') {
    // ── 1. The unfiltered list ─────────────────────────────────────────────────
    await shoot('idle', HOLD.establish)

    // ── 2. Build the search ────────────────────────────────────────────────────
    const filterButton = await firstVisible(page.locator('button.lg\\:hidden'), 'filter button')
    await tapAndShoot(filterButton, 'filters-open', HOLD.panel)

    // Group titles are from filters.tsx: Gender is top level, the other two are nested.
    //
    // "Wants kids" was in the original brief and is deliberately absent. It lives in the Relationship
    // group, which `filters.tsx` renders only when the *signed-in viewer's* own `pref_relation_styles`
    // includes 'relationship' — and the showcase viewer seeks friendship and collaboration. Adding it
    // would mean changing the viewer persona, which is also what the H1 hero clip is captured as. The
    // remaining four facets already narrow to exactly one person, so the beat was not worth that.
    await pickFilter(null, /gender$/i, 'Man', 'gender')
    await pickFilter('Values & Beliefs', /religion$/i, 'Atheist', 'religion')
    await pickFilter('Lifestyle', /diet$/i, 'Vegan', 'diet')

    // Location is a city autocomplete backed by an external geo service, so it is the one beat that can
    // fail for reasons unrelated to the app. Treated as optional: warn and carry on rather than losing
    // the whole capture, since the search is already specific enough without it.
    try {
      // Headers read as label-plus-current-selection — "Living anywhere", "Any gender" — so the section
      // is "Living", never "Location", and never bare. Anchoring the regex at the end (/location$/i,
      // /^living$/i) matched nothing; match the leading word instead.
      const locationSection = await firstVisible(panel().getByText(/^living/i), 'Living section')
      await locationSection.evaluate((el) => el.scrollIntoView({block: 'center'}))
      await tapAndShoot(locationSection, 'location-open', HOLD.tap, 600)

      const cityInput = await firstVisible(
        panel().locator('input[placeholder*="city" i]'),
        'city search box',
      )
      await cityInput.fill(CITY)
      await page.waitForTimeout(2500)
      const cityResult = await firstVisible(
        panel().getByText(CITY, {exact: false}),
        `${CITY} result`,
      )
      await tapAndShoot(cityResult, 'location-set', HOLD.panel, 1500)
    } catch (err) {
      console.warn(`warning: location beat skipped (${err.message})`)
    }

    // ── 3. No results ──────────────────────────────────────────────────────────
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1800)
    await quieten()
    await shoot('no-results', HOLD.empty)

    count = await page
      .locator('text=/\\d+ (people|person)/')
      .first()
      .textContent()
      .catch(() => null)

    // ── 4. Save the search ─────────────────────────────────────────────────────
    const notify = await firstVisible(page.getByText(/get notified/i), 'get-notified button')
    await notify.evaluate((el) => el.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(400)
    await quieten()
    await shoot('notify-visible', HOLD.tap)
    await tapAndShoot(notify, 'saved', HOLD.settle, 2500)
  }

  if (PHASE === 'after') {
    // ── 5. The email ───────────────────────────────────────────────────────────
    // Dissolved into rather than cut to: this is where the clip stops being one continuous session.
    await page.goto(`file://${emailPath}`, {waitUntil: 'networkidle'})
    await page.waitForTimeout(1500)
    await quieten()
    await shoot('email', HOLD.email, {fadeIn: true})

    // Scroll the email far enough to reach the match card, in small steps — a large jump followed by
    // stillness reads as a stutter however long it is held.
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 90)
      await page.waitForTimeout(90)
      await shoot(`email-scroll-${i}`, HOLD.scroll)
    }

    const matchLink = page.getByText(MATCH_NAME, {exact: false}).first()
    if (await matchLink.count()) {
      const tap = await centreOf(matchLink)
      if (tap) shots[shots.length - 1].tap = tap
    } else {
      console.warn(`warning: "${MATCH_NAME}" not found in the email — is the persona seeded?`)
    }

    // ── 6. The profile ─────────────────────────────────────────────────────────
    // Navigated directly rather than by clicking the email link. The link points at the production
    // domain (the template builds absolute https://compassmeet.com URLs), so clicking it would leave the
    // dev server and shoot the wrong database. The tap indicator above still shows the press.
    await page.goto(`${BASE}/${MATCH_SLUG}`, {waitUntil: 'networkidle'})
    await page.waitForTimeout(1500)
    await quieten()

    /**
     * Bounding box of a locator in viewport CSS px, tagged with the search facet it satisfies.
     *
     * Measured live rather than hand-placed against a screenshot, so a profile restyle moves the
     * spotlight with it instead of silently leaving it pointing at empty space. Returns null when the
     * element is missing or off-screen, and the caller drops it — a spotlight on nothing is worse than
     * one fewer spotlight.
     */
    const highlight = async (locator, label) => {
      const el = await visibleMatches(locator)
      if (!el.length) {
        console.warn(`warning: no element to spotlight for "${label}"`)
        return null
      }
      // Measure the *text*, not the element. `boundingBox()` returns the layout box, and in the profile's
      // details list each value sits in a full-width row — so circling that gave a flat oval spanning the
      // whole card rather than a ring round the word. A Range over the text node gives the glyphs' own
      // bounds. Falls back to the layout box if the node has no text (it always does here, but the
      // fallback costs one line and beats returning nothing).
      const box =
        (await el[0].evaluate((node) => {
          const range = document.createRange()
          range.selectNodeContents(node)
          const r = range.getBoundingClientRect()
          return r.width > 0 && r.height > 0
            ? {x: r.x, y: r.y, width: r.width, height: r.height}
            : null
        })) ?? (await el[0].boundingBox())
      if (!box || box.y < 0 || box.y + box.height > VIEWPORT.height) {
        console.warn(`warning: "${label}" is outside the viewport; not spotlighting it`)
        return null
      }
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        w: Math.round(box.width),
        h: Math.round(box.height),
        label,
      }
    }

    // Beat one: who and where. Age, gender and city sit together in the profile header.
    const topSpots = [
      await highlight(page.getByText(/^32 years old$/), 'Age 24–40'),
      await highlight(page.getByText('Man', {exact: true}), 'Man'),
      await highlight(page.getByText(/^Grenoble, France$/), 'Near Grenoble'),
    ].filter(Boolean)
    await shoot('profile-top', HOLD.criteria, {fadeIn: true, highlights: topSpots})

    // Beat two: the two facets that are the whole point of the search. They land in one frame, so the
    // scroll stops here deliberately instead of sweeping past at three frames a step.
    const religionRow = page.getByText('Atheist', {exact: true}).first()
    const dietRow = page.getByText('Vegan', {exact: true}).first()
    await religionRow.evaluate((el) => el.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(700)

    // Centring on religion alone left diet down at y≈762, half under the fixed bottom nav. Re-centre on
    // the midpoint of the two, against the viewport minus that nav, so both sit clear in the frame.
    const NAV_H = 90
    const relBox = await religionRow.boundingBox()
    const dietBox = await dietRow.boundingBox()
    if (relBox && dietBox) {
      const mid = (relBox.y + dietBox.y + dietBox.height) / 2
      const delta = Math.round(mid - (VIEWPORT.height - NAV_H) / 2)
      if (Math.abs(delta) > 8) {
        await page.mouse.wheel(0, delta)
        await page.waitForTimeout(600)
      }
    }
    await quieten()
    await shoot('profile-scroll-approach', HOLD.scroll * 4)

    const detailSpots = [
      await highlight(page.getByText('Atheist', {exact: true}), 'Atheist'),
      await highlight(page.getByText('Vegan', {exact: true}), 'Vegan'),
    ].filter(Boolean)
    await shoot('profile-criteria', HOLD.criteria, {highlights: detailSpots})

    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(90)
      await shoot(`profile-scroll-${i}`, HOLD.scroll)
    }

    // ── 7. Write to him ────────────────────────────────────────────────────────
    // Opens the composer only. Nothing is sent, and the recipient is a fictional persona regardless.
    const contact = page.getByText(/thoughtful message/i).first()
    if (await contact.count()) {
      await contact.evaluate((el) => el.scrollIntoView({block: 'center'}))
      await page.waitForTimeout(700)
      await quieten()
      await shoot('contact-visible', HOLD.panel)
      await tapAndShoot(contact, 'contact-open', HOLD.finale, 2000)
    } else {
      console.warn('warning: no "Send them a thoughtful message" button — clip ends on the scroll')
      await shoot('profile-end', HOLD.finale)
    }
  }

  await browser.close()

  // ── Manifest ───────────────────────────────────────────────────────────────
  // Each phase writes its own frame list. The second run reads the first's and concatenates, so the
  // scene sees one continuous clip and knows nothing about how it was shot.
  writeFileSync(PART_MANIFEST(PHASE), JSON.stringify({frames: shots, resultCount: count}, null, 2))

  if (PHASE === 'before') {
    console.log(`captured ${shots.length} ${THEME} "before" frames`)
    if (Number(count?.match(/^(\d+)/)?.[1] ?? NaN) > 0) {
      console.warn(
        `warning: the search matched ${count}. This half is supposed to find nobody — re-seed with ` +
          `SHOWCASE_SKIP=${MATCH_SLUG} so the match does not exist yet.`,
      )
    }
    console.log(`next: re-seed without SHOWCASE_SKIP, then npm run capture:alert -- --phase after`)
    return
  }

  let before
  try {
    before = JSON.parse(readFileSync(PART_MANIFEST('before'), 'utf8'))
  } catch {
    throw new Error(
      `no "before" frames in ${OUT_DIR}. Run --phase before first (see the header of this file).`,
    )
  }

  const frames = [...before.frames, ...shots]
  const durationInFrames = frames.reduce((sum, f) => sum + f.hold, 0)
  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        theme: THEME,
        capturedAt: new Date().toISOString(),
        viewport: {width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE},
        cssViewport: VIEWPORT,
        scale: SCALE,
        resultCount: before.resultCount,
        durationInFrames,
        frames,
      },
      null,
      2,
    ) + '\n',
  )

  console.log(
    `merged ${before.frames.length} + ${shots.length} = ${frames.length} ${THEME} frames -> ` +
      `media-creator/public/alert/${THEME}/`,
  )
  console.log(`clip length: ${durationInFrames} frames (${(durationInFrames / 30).toFixed(1)}s)`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
