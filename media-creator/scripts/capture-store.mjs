/**
 * Captures the raw app screens that the store screenshots are built from (see render-store.mjs).
 *
 * Store policy on both platforms is that a screenshot depicts the actual app, and this repo's own rule
 * (docs/marketing-visuals.md) is "captured, not mocked" — so every phone screen in the final artwork is a
 * real Playwright shot of localhost:3000, never a drawing of one. This script only produces the bare
 * screens; the branding, headline and device frame are composited afterwards by render-store.mjs.
 *
 * Shot at 390x844 CSS px (iPhone 13 logical size) with DPR 3, not the 2 the video captures use. The
 * clips are displayed at 780px wide; here the same screen is scaled up into a ~1000px-wide device frame
 * on the App Store canvas, so DPR 2 would be a slight upscale and the app's 14px type is exactly where
 * that shows first.
 *
 * ── Auth ──────────────────────────────────────────────────────────────────────
 * Half the screens (the people list, the filter sheet, the composer, saved searches) do not exist
 * logged out. Firebase keeps its session in IndexedDB, which Playwright's storageState does not carry,
 * so this uses a persistent browser profile you sign into by hand once — the same .auth-profile/ that
 * capture-profile.mjs uses, and the same one-off:
 *
 *   node media-creator/scripts/capture-store.mjs --login
 *
 * That opens a real window; sign in, close it, and every later headless run reuses the session.
 *
 * The seeded viewer@compass.showcase account is NOT usable here. It is created through the Firebase
 * *emulator* admin API (tests/e2e/utils/seed-showcase.ts), so it only exists under `yarn dev:isolated`.
 * Against the shared remote dev DB — which is what `yarn dev` and `./scripts/dev_db_seed.sh` use — that
 * account has a Postgres row and no Firebase identity, and the sign-in fails.
 *
 * Public screens (profile pages, /stats) are captured either way, so a session-less run still produces
 * most of the set and says which shots it skipped.
 *
 * ── No price wording in frame (App Store guideline 2.3.7) ────────────────────
 * A screenshot is metadata, so Apple's ban on price references applies to whatever is *inside* the
 * captured screen too, and "free" counts as a price. That rules out the home page (the hero eyebrow
 * reads "Free forever · Open source", and there is an "Open Source & Free Forever" strip further
 * down) and /about (the stat band publishes "$0 / Cost to join"). Neither is in the set; before
 * adding a screen here, read it for price wording first. 1.42.0 (11) was rejected over this —
 * docs/app-store-listing.md, "No price outside the description".
 *
 * ── Showcase profiles only ────────────────────────────────────────────────────
 * The dev DB holds the ten hand-authored showcase personas *and* a tail of faker accounts with
 * lorem-ipsum bios and no photo. A store screenshot with one of those in it is worse than no screenshot,
 * so every list shot is verified against SHOWCASE_SLUGS after the fact and the run fails loudly rather
 * than quietly shipping a default avatar. See `assertShowcaseOnly`.
 *
 * Prerequisites:
 *   yarn dev                              # http://localhost:3000
 *   SHOWCASE=1 ./scripts/dev_db_seed.sh   # the ten personas (run by hand — it mutates the dev DB)
 *
 * Usage:
 *   node media-creator/scripts/capture-store.mjs --login    # one-off, headed, sign in
 *   node media-creator/scripts/capture-store.mjs                   # -> public/store/raw/light/
 *   node media-creator/scripts/capture-store.mjs --theme dark      # -> public/store/raw/dark/
 *   node media-creator/scripts/capture-store.mjs --only search,filters
 *   node media-creator/scripts/capture-store.mjs --persona priyaraman
 *
 * Borrows Playwright from the monorepo root by absolute path — this package stays Remotion-only, the
 * same trick capture-search.mjs and capture-profile.mjs use.
 */

import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import pw from '../../node_modules/@playwright/test/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const RAW_ROOT = join(HERE, '../public/store/raw')
const PROFILE_DIR = join(HERE, '../.auth-profile')

const args = process.argv.slice(2)
const LOGIN = args.includes('--login')
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const BASE = 'http://localhost:3000'

/**
 * /stats is captured from production, not from localhost.
 *
 * Every other screen here is a *layout* and the dev DB is a perfectly good stand-in for one. /stats is
 * not a layout, it is a set of published figures — and against the dev database those figures are
 * wrong: 38 members, a gender split dominated by faker rows ("Other, 58%"), ten countries with one
 * member each. Shipping that to a store listing would put invented numbers about a real community in
 * front of the public, which is a different and much worse thing than an unpolished screenshot.
 *
 * The page is public and needs no session, so pointing this one shot at the live site costs nothing and
 * makes it true. `--stats-base http://localhost:3000` forces the local copy when the point of the run
 * is to check a change to the page itself.
 */
const STATS_BASE = argOf('stats-base', 'https://www.compassmeet.com')

/**
 * The persona whose profile the profile/bio/composer frames are shot on.
 *
 * One person across all three, so the three frames read as one session rather than three unrelated
 * people. Overridable — `--persona <slug>` — because which persona photographs best is a taste call
 * and not worth a code edit.
 */
const PERSONA = argOf('persona', 'sofiacosta')

/**
 * A keyword nobody in the database has, used to drive the results list to zero for the saved-search
 * frame. Overridable, because "nobody has this" is a fact about the data and the data changes — the
 * capture warns rather than failing when the term starts matching someone.
 */
const EMPTY_QUERY = argOf('empty-query', 'astrophotography')

// iPhone 13 logical size. Every store canvas is portrait, and this is the aspect the device frame in
// render-store.mjs is cut for; changing it means changing the bezel there too.
const VIEWPORT = {width: 390, height: 844}
const SCALE = 3

const ONLY = (argOf('only', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Which of the app's two themes to shoot.
 *
 * Not a nicety. The store frames alternate between a cream surround and an espresso one, and a
 * light-theme screenshot inside a dark frame is a bright white slab in the middle of the composition —
 * the single most obvious tell that the artwork was assembled rather than taken. Each frame in
 * render-store.mjs names a theme and reads its screen from the matching directory, so the surround and
 * the screen are always the same theme.
 *
 * The app defaults to `auto`, so Playwright's colorScheme is enough to flip it; no localStorage
 * seeding needed. colorScheme is a context-level setting, hence a whole run per theme rather than a
 * per-shot switch.
 */
const THEME = argOf('theme', 'light')
if (THEME !== 'light' && THEME !== 'dark') {
  throw new Error(`--theme must be "light" or "dark", got "${THEME}"`)
}
const OUT_DIR = join(RAW_ROOT, THEME)

/**
 * The ten hand-authored personas, plus the viewer.
 *
 * Duplicated from tests/e2e/utils/showcase-profiles.ts rather than imported: that file is TypeScript
 * inside the yarn workspace, and this package is deliberately outside it with no build step. The list
 * is only used to *reject* non-showcase names, so drifting out of date fails the run rather than
 * corrupting a screenshot — the safe direction.
 */
const SHOWCASE_NAMES = [
  'Alex Morel',
  'Maya Okonkwo',
  'Tomas Leclerc',
  'Priya Raman',
  'David Hirsch',
  'Amina Haddad',
  'Joon Park',
  'Sofia Costa',
  'Marcus Adeyemi',
  'Ellen Ostrom',
  'Rafael Mendes',
  'Julien Sarr',
]

/**
 * First *visible* match for a locator.
 *
 * Both filter UIs are always in the DOM — the desktop rail and the mobile sheet — with one hidden by
 * `lg:` classes. Playwright's `.first()` is DOM order, not visibility, so on a phone viewport it
 * happily hands back the hidden desktop control and then times out waiting for it to become clickable.
 * Lifted verbatim from capture-search.mjs; the hazard outlived the layout that created it.
 */
async function firstVisible(locator, label) {
  const n = await locator.count()
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i)
    if (await el.isVisible().catch(() => false)) return el
  }
  throw new Error(`no visible element for ${label} (${n} hidden match(es))`)
}

mkdirSync(OUT_DIR, {recursive: true})

const context = await pw.chromium.launchPersistentContext(PROFILE_DIR, {
  headless: !LOGIN,
  viewport: LOGIN ? {width: 430, height: 932} : VIEWPORT,
  deviceScaleFactor: LOGIN ? 1 : SCALE,
  isMobile: !LOGIN,
  hasTouch: !LOGIN,
  colorScheme: THEME,
  // The seeded copy is English-only; a stray locale would put half the UI in another language.
  locale: 'en-GB',
})

const page = context.pages()[0] ?? (await context.newPage())

if (LOGIN) {
  await page.goto(`${BASE}/signin`)
  console.log('\nSign in in the window that just opened, then close it.')
  console.log('The session is kept in media-creator/.auth-profile/ for every later headless run.\n')
  await page.waitForEvent('close', {timeout: 0}).catch(() => {})
  await context.close()
  process.exit(0)
}

/**
 * Everything that must not be in frame.
 *
 * Re-applied after every navigation, because `addStyleTag` is per-document and a client-side route
 * change in Next keeps the document — but a full page load does not.
 *
 * - Animations off, so no shot lands mid-transition (a half-faded card is invisible in review and
 *   obvious at 1080px).
 * - The Next dev badge is a shadow-DOM portal, so it can only be killed by tag name.
 */
const QUIET_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; }
  nextjs-portal, #__next-build-watcher { display: none !important; }
`

const quieten = () => page.addStyleTag({content: QUIET_CSS}).catch(() => {})

/**
 * Answer the analytics-consent banner before it can render.
 *
 * It is a fixed card over the bottom-right of the viewport — on a phone it covers a third of the
 * screen, and it is timely copy besides. Clicking "No thanks" works but has to happen on every route
 * that mounts it, and each click is a frame's worth of race; the choice is a plain cookie
 * (`analytics-consent`, web/lib/consent.ts), so setting it on the context means the banner is simply
 * never shown.
 *
 * `denied`, not `granted`: these runs are automation, and counting them as feature usage would put
 * noise in the very numbers /stats publishes.
 */
async function declineConsent() {
  // Both origins: the stats shot comes off the live site, which shows the same banner.
  await context.addCookies(
    ['localhost', new URL(STATS_BASE).hostname].map((domain) => ({
      name: 'analytics-consent',
      value: 'denied',
      domain,
      path: '/',
      sameSite: 'Lax',
    })),
  )
}

/** Loud if the banner made it into frame anyway — a cookie name change would otherwise go unnoticed. */
async function assertNoConsentBanner(label) {
  if (await page.getByLabel('Analytics consent').count()) {
    throw new Error(
      `${label}: the analytics-consent banner is in frame. Has the cookie name in ` +
        `web/lib/consent.ts changed?`,
    )
  }
}

/**
 * Dismiss the growth-phase banner on the people list.
 *
 * Timely copy that would date the artwork, and on a phone it costs a third of the screen. The
 * affordance is an ✕ in the banner's corner (profiles/profiles-home.tsx), so "Dismiss" survives only as
 * its aria-label — matching on visible text silently finds nothing and leaves the banner in.
 */
async function dismissBanner() {
  const dismiss = page.getByLabel('Dismiss', {exact: true})
  if (await dismiss.count()) {
    await dismiss
      .first()
      .click({timeout: 5000})
      .catch(() => {})
    await page.waitForTimeout(600)
  }
}

const shots = []

/**
 * Park the virtual pointer somewhere inert before every shot.
 *
 * Playwright leaves the mouse wherever it last clicked, so whatever sits under that point stays
 * hovered — in the search clip the pointer once rested on a card's bookmark icon and its "Save Profile"
 * tooltip hung over the results for the entire capture. The top-left corner is page padding on every
 * screen used here.
 */
const parkPointer = () => page.mouse.move(2, 2)

async function shoot(name) {
  await parkPointer()
  await page.evaluate(() => document.activeElement?.blur?.()).catch(() => {})
  await quieten()
  await page.waitForTimeout(250)
  const file = `${name}.png`
  await page.screenshot({path: join(OUT_DIR, file)})
  shots.push(file)
  console.log(`  ✓ ${file}`)
}

async function go(url, {waitFor, settleMs = 1200} = {}) {
  await page.goto(url, {waitUntil: 'domcontentloaded'})
  await page.waitForLoadState('networkidle').catch(() => {})
  if (waitFor) {
    const found = await page
      .waitForSelector(waitFor, {timeout: 30000})
      .then(() => true)
      .catch(() => false)
    if (!found) console.warn(`    warning: never saw ${waitFor} — the shot may be of a skeleton`)
  }
  await quieten()
  await page.waitForTimeout(settleMs)
  // Photos are the whole point of using the showcase personas; a shot taken before they decode gets
  // grey boxes where the faces are.
  await page
    .evaluate(() => Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => {}))))
    .catch(() => {})
  await page.waitForTimeout(400)
}

/**
 * Fail the run if any non-showcase person is visible.
 *
 * The dev DB's faker accounts have lorem-ipsum bios and no photo, and the showcase personas are only
 * the *newest* ten — so any list that scrolls far enough, or sorts by anything but "New", reaches them.
 * Rather than trusting the ordering, read the names actually on screen and check them.
 */
async function assertShowcaseOnly(label) {
  const names = await page.evaluate(() =>
    Array.from(document.querySelectorAll('h1, h2, h3, h4'))
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
      })
      .map((el) => el.textContent?.trim() ?? ''),
  )
  // Anything that looks like a person's name: two capitalised words. Section headings ("People",
  // "Saved Searches") have one word or lowercase connectives, so they fall out on their own.
  const people = names.filter((n) => /^[A-Z][\p{L}'’-]+ [A-Z][\p{L}'’-]+$/u.test(n))
  const strangers = people.filter((n) => !SHOWCASE_NAMES.includes(n))
  if (strangers.length) {
    throw new Error(
      `${label}: non-showcase profile(s) in frame: ${strangers.join(', ')}. ` +
        `Those accounts are faker seed data with no photo — re-check the sort order or scroll position.`,
    )
  }
  console.log(`    showcase-only ✓ (${people.length} in frame: ${people.join(', ') || 'none'})`)
}

const wanted = (name) => ONLY.length === 0 || ONLY.includes(name)

// ── Are we signed in? ─────────────────────────────────────────────────────────
await declineConsent()
await go(`${BASE}/`)
await page.waitForTimeout(1500)
await assertNoConsentBanner('home')
// The logged-out home is the marketing page and renders the hero headline; the signed-in one renders
// the people list. Matching on the search box is the least brittle tell.
const signedIn = (await page.locator('input[placeholder*="Search"]').count()) > 0
console.log(signedIn ? 'session: signed in' : 'session: SIGNED OUT (public screens only)')

// ─────────────────────────────────────────────────────────────────────────────
// Public screens
// ─────────────────────────────────────────────────────────────────────────────

if (wanted('profile')) {
  console.log(`\nprofile — the top of ${PERSONA}'s profile`)
  await go(`${BASE}/${PERSONA}`)
  await quieten()
  await page.waitForTimeout(800)
  await assertShowcaseOnly('profile')
  await shoot('profile')
}

if (wanted('bio')) {
  console.log('\nbio — the same profile, scrolled to the prose')
  // "About Me" is the card that makes the twenty-minutes-to-write claim concrete. Centred rather than
  // scrollIntoViewIfNeeded, which stops as soon as the element is technically in the viewport and
  // parks it flush against an edge.
  const about = page.getByText('About Me', {exact: true}).first()
  if (await about.count()) {
    // Scrolled to an exact offset rather than with `block: 'start'`, which parks the heading flush
    // against the viewport's top edge where the device frame's corner radius shaves the letters. 40px
    // is enough margin to survive the rounding and still short of the card above, whose bottom sits
    // about 65px clear — a larger nudge drags its last line into shot.
    await about.evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40),
    )
    await page.waitForTimeout(900)
  } else {
    await page.mouse.wheel(0, 1400)
    await page.waitForTimeout(900)
    console.warn('    warning: no "About Me" heading — fell back to a fixed scroll')
  }
  await shoot('bio')
}

if (wanted('stats')) {
  console.log(`\nstats — the public numbers (${STATS_BASE})`)
  // The distributions are fetched client-side and the page renders a skeleton first — against
  // production, over the network, that skeleton outlasts `networkidle` comfortably. Wait for a figure
  // that only exists once the data has landed rather than for a duration.
  await go(`${STATS_BASE}/stats`, {waitFor: 'text=Where members are', settleMs: 2500})
  // Past the hero counters to the distributions, which are the part that says something a competitor
  // would not publish.
  // The world map is the one figure on this page that reads at a glance, so the shot is framed on it
  // rather than on the counters above. 40px of clearance for the same reason as the bio shot: flush
  // against the top edge, the device frame's corner radius eats the heading.
  const who = page.getByText(/where members are/i).first()
  const anchor = (await who.count()) ? who : page.getByText(/who's on compass/i).first()
  if (await anchor.count()) {
    await anchor.evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40),
    )
    await page.waitForTimeout(1200)
  } else {
    console.warn('    warning: no distribution heading found — the shot may open on the counters')
  }
  await quieten()
  await shoot('stats')
}

// ─────────────────────────────────────────────────────────────────────────────
// Signed-in screens
// ─────────────────────────────────────────────────────────────────────────────

if (!signedIn) {
  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({capturedAt: new Date().toISOString(), theme: THEME, signedIn, shots}, null, 2) +
      '\n',
  )
  console.warn(
    '\nSkipped the people list, filters, composer and saved searches — they do not exist logged out.' +
      '\nRun once with --login, sign in, then re-run this.',
  )
  await context.close()
  process.exit(0)
}

const openFilterSheet = () =>
  firstVisible(page.locator('[data-testid="open-filters-button"]'), 'filter button')

/**
 * Clear the filter state the signed-in account brings with it.
 *
 * "Who I'm looking for" seeds the search from the viewer's saved preferences, so the app opens on a
 * list already narrowed — a filter badge reading 3 and a count nobody reading a screenshot has a reason
 * for. The hero shot is an argument about being able to see everyone, so it has to open on everyone.
 */
async function resetFilters() {
  await (await openFilterSheet()).click()
  await page.waitForTimeout(900)
  const reset = page.getByText('Reset filters', {exact: true})
  if (await reset.count()) {
    await reset.first().click()
    await page.waitForTimeout(1600)
  } else {
    console.warn('    warning: no "Reset filters" control — the list may open pre-filtered')
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1400)
  await page.evaluate(() => document.activeElement?.blur())
  await quieten()
}

if (wanted('search')) {
  console.log('\nsearch — the people list, unfiltered')
  await go(`${BASE}/`)
  await dismissBanner()
  await resetFilters()
  // Newest first, so the ten showcase personas are the ten at the top and the faker tail is far below
  // the fold. Verified rather than assumed — see assertShowcaseOnly.
  await page.waitForTimeout(800)
  await assertShowcaseOnly('search')
  await shoot('search')
}

if (wanted('filters')) {
  console.log('\nfilters — the filter sheet, on the value fields')
  await go(`${BASE}/`)
  await dismissBanner()
  await (await openFilterSheet()).click()
  await page.waitForTimeout(1400)

  // Sections start collapsed, and a sheet of nine collapsed headers is a screenshot of a table of
  // contents: it names the categories and shows not one actual filter, while the frame beside it claims
  // twenty of them across politics, religion and diet. Expanding the two that carry those fields is
  // what makes the shot evidence rather than assertion — and it fills the bottom third, which the
  // collapsed sheet leaves empty.
  // Values & Beliefs specifically, and only it — the sheet is an accordion, so a second expansion just
  // closes the first. It is also the section that matches the frame's caption (politics, religion),
  // whereas Lifestyle puts Tobacco, Psychedelics and Cannabis at display size in a store listing, which
  // is a review conversation nobody needs to have over a filter category.
  const section = 'Values & Beliefs'
  const header = page.getByText(section, {exact: true}).first()
  if (await header.count()) {
    await header.click()
    await page.waitForTimeout(800)
  } else {
    console.warn(`    warning: no "${section}" filter section — has the sheet been renamed?`)
  }

  // And one leaf open beneath it. The section on its own still only lists field *names*; the leaf is
  // where the actual selectable values live, and a screenshot that shows them is the difference between
  // "there is a politics filter" and "here is what filtering by politics looks like".
  const leaf = page.getByText('Politics', {exact: true}).first()
  if (await leaf.count()) {
    await leaf.click()
    await page.waitForTimeout(800)
  } else {
    console.warn('    warning: no "Politics" leaf filter — the sheet shows field names only')
  }
  // Back to the top: expanding the first section pushes the second one's toggle down, and the sheet
  // scrolls to follow the click.
  await page.evaluate(() => {
    const sheet =
      document.querySelector('[data-testid="filter-sheet"]') ?? document.scrollingElement
    sheet.scrollTop = 0
  })
  await page.waitForTimeout(500)
  await quieten()
  await shoot('filters')
}

if (wanted('message')) {
  console.log('\nmessage — the composer and its 200-character floor')
  await go(`${BASE}/${PERSONA}`)
  // The CTA is "Message <first name>" inside the Connect section (profile/connect-actions.tsx).
  // Scoped to #connect deliberately: profile-header.tsx renders a second button with the same label
  // at the top of the page.
  const contact = page
    .locator('#connect')
    .getByText(/^Message /)
    .first()
  if (await contact.count()) {
    await contact.evaluate((el) => el.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(700)
    await contact.click()
    await page.waitForTimeout(2000)
    // Left empty on purpose. Typing "Hey" would demonstrate the floor being enforced, but it also
    // clears the placeholder — and the placeholder ("What genuinely resonated with you in <name>'s
    // profile?") together with the disabled "Write 200 more characters to unlock" button already makes
    // the point, in the product's own words, without a stray word in the box that reads as a real
    // half-written message to a real person.
    await quieten()
    await shoot('message')
  } else {
    console.warn('    warning: no "Message <name>" button in #connect — skipped')
  }
}

if (wanted('alert')) {
  console.log(`\nalert — the saved-search offer on an empty result`)
  await go(`${BASE}/`)
  await dismissBanner()
  await resetFilters()

  // Not the Saved Searches list. On an account that has never saved one it is an empty state — a
  // heading and a sentence telling you to press a button that is not on screen — which is a screenshot
  // of nothing. And the alternative, saving a real search first, means leaving a live daily-email
  // subscription behind on someone's account as a side effect of taking a picture.
  //
  // The no-results state carries the same feature and reads better besides: the search that found
  // nobody, the chips saying what was searched for, the CTA, and the promise under it. It is also the
  // honest moment for the feature — nobody saves a search that already works.
  const box = await firstVisible(page.locator('input[placeholder*="Search"]'), 'search box')
  await box.click()
  await box.type(EMPTY_QUERY, {delay: 45})
  await page.waitForTimeout(3000)

  const count = await page
    .locator('[data-testid="people-profile-count"]')
    .first()
    .textContent()
    .catch(() => null)
  const matched = Number(count?.match(/^(\d+)/)?.[1] ?? NaN)
  if (matched > 0) {
    console.warn(
      `    warning: "${EMPTY_QUERY}" matched ${count} — the empty state will not render. ` +
        `Pass --empty-query with a term nobody has.`,
    )
  }

  const cta = page.getByText(/No profiles found/i).first()
  if (await cta.count()) {
    await cta.evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120),
    )
    await page.waitForTimeout(700)
  }
  await quieten()
  await shoot('alert')
}

writeFileSync(
  join(OUT_DIR, 'manifest.json'),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      theme: THEME,
      signedIn,
      cssViewport: VIEWPORT,
      scale: SCALE,
      pixels: {width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE},
      shots,
    },
    null,
    2,
  ) + '\n',
)

console.log(
  `\ncaptured ${shots.length} ${THEME} screens -> media-creator/public/store/raw/${THEME}/`,
)
await context.close()
