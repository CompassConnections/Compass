/**
 * Renders the App Store / Google Play screenshots from the raw app captures (see capture-store.mjs).
 *
 * Eight frames. Each is a headline, a one-line gloss, and a real screenshot of the running app inside a
 * device frame — except the last, which is a statement card and carries no device. Nothing here draws a
 * fake UI: the phone screens are `public/store/raw/*.png`, straight off localhost:3000.
 *
 * ── Why a browser and not an image library ────────────────────────────────────
 * The frames are typography over a gradient with one photographic element, which is a layout problem,
 * and the layout has to re-solve itself at three quite different aspect ratios (0.56 for Play, 0.46 for
 * the App Store phone, 0.75 for the iPad). CSS does that; a canvas library would mean hand-computing
 * every position three times over. It is also the same Playwright the captures already use, so there is
 * no new dependency.
 *
 * ── Three canvases, one design ────────────────────────────────────────────────
 * Type is sized off the canvas *width* and the layout off its *height*, which is the only way one
 * design survives both. Sizing everything off height makes the App Store frame's headline enormous
 * relative to its narrower column; sizing off width leaves the Play frame's device with nowhere to go.
 * The device is measured to fill whatever the header does not want, then bled 10% off the bottom edge —
 * the bleed is what stops the composition reading as a phone floating in a box.
 *
 *   Google Play  1080x1920   (9:16; Play takes 2-8 phone shots, each side 320-3840px)
 *   App Store    1290x2796   (6.9" iPhone — the one size Apple still requires; up to 10)
 *   App Store    2064x2752   (13" iPad — also required, because the build ships as a universal app)
 *
 * ── Why there is an iPad canvas at all ────────────────────────────────────────
 * `TARGETED_DEVICE_FAMILY = "1,2"` in ios/App/App.xcodeproj: the binary is universal, so App Store
 * Connect refuses to accept the version for review until the 13" iPad slot is filled ("You must upload
 * a screenshot for 13-inch iPad displays"). It only takes 2064x2752, 2752x2064, 2048x2732 or 2732x2048
 * — the 6.9" iPhone artwork is rejected on dimensions — and a 13" set is auto-scaled down to the other
 * iPad sizes, so this one canvas is the whole iPad requirement.
 *
 * The device inside the iPad frame is still the *phone* capture, not an iPad one: public/store/raw/ is
 * shot at 390x844 and there is no tablet capture pass. A 4:3 canvas cannot hold a 19.5:9 device at the
 * 76% width the phone canvases give it — the geometry below caps out around 55% — so the iPad frames
 * carry a deliberately larger bleed and a lower "device looks too small" threshold. If the listing ever
 * needs to show the app's actual tablet layout (the `lg:` filter rail rather than the sheet), that is a
 * capture-side change: shoot at 1032x1376 CSS px @2x into raw/ipad/ and point this target at it.
 *
 * ── Fonts ─────────────────────────────────────────────────────────────────────
 * Newsreader for headlines and DM Sans for everything else: the same two faces the product uses
 * (web/tailwind.config.js `heading` / `dm-sans`), loaded from public/fonts/ so the render is offline and
 * deterministic. `npm run fonts` fetches them; render-store runs that check itself and says so if they
 * are missing rather than silently falling back to a system serif.
 *
 * Usage:
 *   node media-creator/scripts/render-store.mjs                  # every canvas, all frames
 *   node media-creator/scripts/render-store.mjs --target play
 *   node media-creator/scripts/render-store.mjs --target ipad
 *   node media-creator/scripts/render-store.mjs --only 1,5,8
 *   node media-creator/scripts/render-store.mjs --no-feature     # skip the Play feature graphic
 *
 * Output -> media-creator/out/store/{play,ios,ipad}/NN-<key>.png, plus play/feature-graphic.png.
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import pw from '../../node_modules/@playwright/test/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const RAW_DIR = join(HERE, '../public/store/raw')
const FONT_DIR = join(HERE, '../public/fonts')
const WORK_DIR = join(HERE, '../public/store')
const OUT_ROOT = join(HERE, '../out/store')
const ICON = join(HERE, '../../web/public/icons/icon-512x512.png')

const args = process.argv.slice(2)
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const ONLY = (argOf('only', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
// `both` predates the iPad canvas and is kept as an alias for `all`, so an old command line does
// not quietly render two thirds of the set.
const TARGET = argOf('target', 'all')
const WITH_FEATURE = !args.includes('--no-feature')

// ─── Palette ──────────────────────────────────────────────────────────────────
// Straight off web/styles/globals.css. Both themes are the app's own, so a screenshot's surround is the
// same material as the screen inside it rather than a marketing skin bolted on.
const C = {
  canvas: '#EDE8E0', // canvas-100, the page background
  card: '#F7F4EF', // canvas-50
  tan: '#E8D5BC', // canvas-200
  ink: '#1E1A14', // ink-900
  inkMuted: '#6E6252', // ink-600
  amber: '#C17F3E', // primary-500, the brand base
  amberDeep: '#A6682E', // cta — the amber white text is allowed to sit on
  espresso: '#2C2416', // canvas-950
  espressoDeep: '#161210',
  creamInk: '#F7F4EF',
  creamMuted: '#BCAB95',
  sage: '#6B8F71',
}

// ─── Canvases ─────────────────────────────────────────────────────────────────
const TARGETS = {
  play: {dir: 'play', width: 1080, height: 1920, label: 'Google Play phone'},
  ios: {dir: 'ios', width: 1290, height: 2796, label: 'App Store 6.9" iPhone'},
  // 4:3, and the phone in it is the same 19.5:9 capture as the other two. Both overrides follow from
  // that. `bleed`: the device is height-bound on every canvas — its width is whatever its height allows
  // — so a canvas this squat gives it nowhere to grow sideways, and running more of it off the bottom
  // edge is the only lever that makes it read as large. `minDeviceRatio`: the 0.55-of-frame-width alarm
  // below is calibrated for the phone canvases, where the device lands at 0.76; here the geometry tops
  // out near 0.55 with an empty header, so the default threshold would fire on every frame and mean
  // nothing.
  ipad: {
    dir: 'ipad',
    width: 2064,
    height: 2752,
    label: 'App Store 13" iPad',
    bleed: 0.18,
    minDeviceRatio: 0.42,
  },
}

/**
 * The set, in listing order.
 *
 * Order is an argument, not a gallery: 1 is the whole pitch in three words, 2-3 answer "what is there to
 * search", 4-6 are the three things Compass does that its category does not, 7 is the proof, 8 is who
 * owns the thing. A browser who stops after two frames has still had the pitch.
 *
 * ── No price, anywhere in here (App Store guideline 2.3.7) ────────────────────
 * Submission 1.42.0 (11) was rejected because frame 8 read "Free forever" over badges saying "No ads"
 * and "No subscriptions". Apple counts a reference to a *free* or discounted service as a price
 * reference, and price references are not allowed in screenshots — only in the app description, which
 * is why docs/app-store-listing.md still says "free" in the description block and nowhere else.
 * So: no "free", "no subscriptions", "no paywall", "no in-app purchases", "donate", currency symbols
 * or running-cost figures in any headline, sub, badge or captured screen. Frame 8 makes the same
 * argument structurally — open source, member-governed — which is a fact about governance rather than
 * a claim about money.
 *
 * `<em>` in a headline renders amber — one emphasis per frame, on the word the frame is actually about.
 * Copy is the product's own, from web/components/home/home.tsx and web/pages/about.tsx, so the listing
 * and the site make the same claims in the same voice.
 */
const FRAMES = [
  {
    key: 'search',
    shot: 'search.png',
    theme: 'light',
    headline: "Don't swipe. <em>Search.</em>",
    sub: 'Read every profile, and search all of them by values, interests, or a word in a bio.',
  },
  {
    key: 'filters',
    shot: 'filters.png',
    theme: 'light',
    headline: 'Filter for what <em>matters</em>.',
    sub: 'Over twenty filters — politics, religion, diet, languages, what someone is looking for.',
  },
  {
    key: 'profile',
    shot: 'profile.png',
    theme: 'light',
    headline: 'Twenty minutes to write. <em>Not two.</em>',
    sub: 'A bio in their own words, prompt answers, causes, personality. Every field optional.',
  },
  {
    key: 'bio',
    shot: 'bio.png',
    theme: 'dark',
    headline: 'Written to be <em>read</em>.',
    sub: 'Real prose and real photos. You see the whole profile before you decide anything.',
  },
  {
    key: 'message',
    shot: 'message.png',
    theme: 'light',
    headline: 'No <em>“hey”</em>.',
    sub: 'A first message is 200 characters minimum. The composer waits until you have said something.',
  },
  {
    key: 'alert',
    shot: 'alert.png',
    theme: 'light',
    headline: 'Save the search. <em>We’ll email you.</em>',
    sub: 'Nobody fits today? We tell you the day someone who does joins.',
  },
  {
    key: 'stats',
    shot: 'stats.png',
    theme: 'light',
    headline: 'Every number, <em>in public</em>.',
    sub: 'Who is here, where they are, and how the place is run. Published, not curated.',
  },
  {
    key: 'open',
    kind: 'statement',
    theme: 'dark',
    headline: 'Built in the <em>open</em>.',
    sub: 'Every line of Compass is on GitHub. Members write the rules, and vote on them in public.',
    badges: ['Open source', 'Member governed', 'No hidden ranking'],
    footer: 'compassmeet.com',
  },
]

// ─── Fonts ────────────────────────────────────────────────────────────────────
const FONT_FILES = {
  newsreader: 'Newsreader-latin.woff2',
  dmsans: 'DMSans-latin.woff2',
}

const missingFonts = Object.values(FONT_FILES).filter((f) => !existsSync(join(FONT_DIR, f)))
if (missingFonts.length) {
  console.error(
    `missing font file(s): ${missingFonts.join(', ')}\n` +
      `Run: cd media-creator && npm run fonts`,
  )
  process.exit(1)
}

/**
 * Fonts and images go in as data URIs rather than file:// references.
 *
 * The page is written into public/store/ and opened over file://, where Chromium treats every local
 * file as a distinct opaque origin — a woff2 loaded from a sibling directory is a cross-origin font
 * request and is refused, silently, leaving the headline in a system serif that looks close enough to
 * Newsreader to pass review on screen. Inlining removes the question.
 */
const dataUri = (path, mime) => `data:${mime};base64,${readFileSync(path).toString('base64')}`

const FONT_CSS = `
  @font-face {
    font-family: 'Newsreader';
    src: url('${dataUri(join(FONT_DIR, FONT_FILES.newsreader), 'font/woff2')}') format('woff2');
    font-weight: 400 700;
    font-display: block;
  }
  @font-face {
    font-family: 'DM Sans';
    src: url('${dataUri(join(FONT_DIR, FONT_FILES.dmsans), 'font/woff2')}') format('woff2');
    font-weight: 400 500;
    font-display: block;
  }
`

const ICON_URI = existsSync(ICON) ? dataUri(ICON, 'image/png') : null
if (!ICON_URI) console.warn(`warning: no app icon at ${ICON} — frames render without the brand mark`)

// ─── Geometry ─────────────────────────────────────────────────────────────────
// The capture is 390x844 CSS px. The device frame adds a bezel all round, so its *outer* aspect is
// slightly squarer than the screen's.
const SCREEN_ASPECT = 844 / 390
const BEZEL_RATIO = 0.026 // of the screen width
const DEVICE_W_RATIO = 1 + BEZEL_RATIO * 2
const DEVICE_H_RATIO = SCREEN_ASPECT + BEZEL_RATIO * 2

/**
 * Fit the device into whatever the header actually took.
 *
 * The header is *measured*, not budgeted. A fixed fraction of the canvas is the obvious way to split
 * the frame and it is wrong here: the headlines are between two and five words, they wrap differently
 * at 1080 and at 1290, and a budget that fits the longest one leaves the shortest one floating over a
 * gap — while a budget that fits the shortest silently clips the brand row off the top of the longest.
 * So the page lays the type out first, this reads the height back, and the phone takes the remainder.
 *
 * `bleed` is the fraction of the device that runs off the bottom edge. It is what stops the frame
 * reading as a phone photographed inside a box; a fully contained device looks like a product listing,
 * a bled one looks like a screen you are already inside.
 */
function fitDevice({width, height, headerH, bleed = 0.1}) {
  let deviceH = (height - headerH) / (1 - bleed)
  let screenW = deviceH / DEVICE_H_RATIO
  const maxScreenW = (width * 0.76) / DEVICE_W_RATIO
  if (screenW > maxScreenW) {
    screenW = maxScreenW
    deviceH = screenW * DEVICE_H_RATIO
  }
  const bezel = Math.round(screenW * BEZEL_RATIO)
  return {
    screenW: Math.round(screenW),
    screenH: Math.round(screenW * SCREEN_ASPECT),
    bezel,
    deviceW: Math.round(screenW * DEVICE_W_RATIO),
    deviceH: Math.round(deviceH),
    // How far the device hangs past the bottom edge. Applied as a negative margin against a
    // bottom-aligned stage rather than being baked into the height, so the crop is guaranteed: when the
    // width cap bites — which it does on the taller App Store canvas — the leftover shows up as air
    // between the type and the phone, never as a gap under it.
    bleedPx: Math.round(deviceH * bleed),
    radius: Math.round(screenW * 0.125),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * The compass rose from the app mark, oversized and nearly invisible behind the type.
 *
 * A flat gradient at this size reads as a template; something with structure in it reads as artwork.
 *
 * Drawn from favicon.svg's own outline path rather than from icons/icon-512x512.png, because that PNG
 * has an opaque cream ground — laid over the gradient at 5% it is not a faint compass, it is a faint
 * *square* with a compass in it, which is exactly the seam a watermark exists to avoid. The first path
 * in the file is the rose silhouette; everything after it is interior detail that disappears at this
 * opacity anyway.
 */
const ROSE_PATH = (() => {
  const svg = readFileSync(join(HERE, '../../web/public/favicon.svg'), 'utf8')
  // Skip the background rect (`M0 0h512v512H0z`) and take the next path, which is the outline.
  const paths = [...svg.matchAll(/d="([^"]+)"/g)].map((m) => m[1])
  return paths.find((d) => !/^M0 0h512v512H0z$/.test(d)) ?? null
})()

function watermark(theme, width) {
  if (!ROSE_PATH) return ''
  // Sized and offset so roughly three quarters of the rose is on canvas. An earlier pass cropped it
  // to a corner sliver, which at 6% opacity did not read as a compass at all — it read as a smudge,
  // and a smudge is worse than a clean gradient.
  const size = Math.round(width * 0.72)
  return `
    <svg class="watermark" viewBox="0 0 512 512" aria-hidden="true"
         style="width:${size}px;height:${size}px;
                top:${-Math.round(size * 0.16)}px;right:${-Math.round(size * 0.2)}px;
                opacity:${theme === 'dark' ? 0.06 : 0.05}">
      <path d="${ROSE_PATH}" fill="${theme === 'dark' ? C.creamInk : C.espresso}"/>
    </svg>`
}

function backdrop(theme) {
  return theme === 'dark'
    ? `
      background:
        radial-gradient(ellipse 95% 52% at 50% -6%, rgba(193,127,62,0.34), transparent 66%),
        radial-gradient(ellipse 80% 44% at 108% 92%, rgba(107,143,113,0.16), transparent 68%),
        linear-gradient(178deg, ${C.espresso} 0%, ${C.espressoDeep} 100%);`
    : `
      background:
        radial-gradient(ellipse 95% 52% at 50% -6%, rgba(193,127,62,0.30), transparent 64%),
        radial-gradient(ellipse 80% 44% at 108% 92%, rgba(107,143,113,0.14), transparent 68%),
        linear-gradient(178deg, ${C.card} 0%, ${C.canvas} 62%, #E4DDD2 100%);`
}

/**
 * One frame's HTML.
 *
 * `--u` is the type scale: 1% of the canvas *width*, so every size below is written as a fraction of
 * the frame's own width and holds its proportions across both canvases. Vertical placement is in px off
 * the geometry, which is measured from the height. Mixing the two is deliberate — see the note on
 * `geometry`.
 */
function frameHtml(frame, target) {
  const {width, height} = target
  const dark = frame.theme === 'dark'
  const ink = dark ? C.creamInk : C.ink
  const muted = dark ? C.creamMuted : C.inkMuted
  // The brand base is 2.7:1 on the light canvas, under AA even for display type. One ramp step down
  // clears it; the ramp inverts in dark mode, so there the *lighter* amber is the legible one. Same
  // reasoning as the `text-primary-600` note in web/components/home/home.tsx.
  const accent = dark ? '#DCAB71' : C.amberDeep

  const brand = ICON_URI
    ? `<div class="brand">
         <img src="${ICON_URI}" alt=""/>
         <span>Compass</span>
       </div>`
    : ''

  const body =
    frame.kind === 'statement'
      ? `
      <div class="statement">
        ${ICON_URI ? `<img class="mark" src="${ICON_URI}" alt=""/>` : ''}
        <h1>${frame.headline}</h1>
        <p class="sub">${frame.sub}</p>
        <div class="badges">
          ${(frame.badges ?? []).map((b) => `<span>${b}</span>`).join('')}
        </div>
        <div class="footer">${frame.footer ?? ''}</div>
      </div>`
      : `
      <div class="header">
        ${brand}
        <h1>${frame.headline}</h1>
        <p class="sub">${frame.sub}</p>
      </div>
      <div class="stage">
        <div class="device">
          <div class="screen">
            <img src="raw/${frame.theme}/${frame.shot}" alt=""/>
          </div>
        </div>
      </div>`

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${FONT_CSS}
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${width}px; height:${height}px; overflow:hidden; }
body {
  /* The type scale: 1% of the canvas *width*. Every size below is a fraction of the frame's own width,
     which is what lets one design hold its proportions across two different aspect ratios. Vertical
     placement is in px, computed from the measured header — see fitDevice. */
  --u: ${width / 100}px;
  /* Filled in after the header is measured. */
  --device-w: 0px; --device-h: 0px; --bezel: 0px; --radius: 0px; --bleed: 0px;
  position:relative;
  display:flex; flex-direction:column;
  ${backdrop(frame.theme)}
  font-family:'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing:antialiased;
}

.watermark { position:absolute; pointer-events:none; }

/* ── Header ─────────────────────────────────────────────────────────────── */
.header {
  position:relative; z-index:2;
  flex:none;
  padding:calc(var(--u) * 8) calc(var(--u) * 8) calc(var(--u) * 5.4);
  display:flex; flex-direction:column; gap:calc(var(--u) * 2.4);
  /* Both filled in after the device is fitted. The header is measured at its natural height first;
     it is then stretched to whatever the device left over and its contents re-centred inside that.
     Without this the leftover all lands in one place — a lake between the sub-line and the phone,
     which on the 2796px canvas (where the width cap bites hardest) was about 330px of nothing. */
  height:var(--header-h, auto);
  justify-content:var(--header-justify, flex-start);
}

.brand {
  display:flex; align-items:center; gap:calc(var(--u) * 1.5);
  margin-bottom:calc(var(--u) * 1.4);
}
.brand img {
  width:calc(var(--u) * 5.2); height:calc(var(--u) * 5.2);
  border-radius:calc(var(--u) * 1.3);
  /* The icon is drawn on its own cream ground, so on a dark frame it arrives as a bright tile. The
     ring turns that into a deliberate edge rather than a seam. */
  box-shadow:0 0 0 1px rgba(${dark ? '247,244,239,0.16' : '44,36,22,0.10'});
}
.brand span {
  font-size:calc(var(--u) * 2.4); font-weight:500;
  letter-spacing:calc(var(--u) * 0.3);
  text-transform:uppercase;
  color:${accent};
}

h1 {
  font-family:'Newsreader', Georgia, serif;
  font-weight:700;
  font-size:calc(var(--u) * 8.2);
  line-height:1.04;
  letter-spacing:calc(var(--u) * -0.13);
  color:${ink};
  text-wrap:balance;
}
h1 em { font-style:normal; color:${accent}; }

.sub {
  font-size:calc(var(--u) * 2.95);
  line-height:1.45;
  color:${muted};
  max-width:calc(var(--u) * 80);
  text-wrap:pretty;
}

/* ── Device ─────────────────────────────────────────────────────────────── */
.stage {
  position:relative; z-index:1;
  flex:1; min-height:0;
  display:flex; justify-content:center; align-items:flex-end;
}

.device {
  width:var(--device-w); height:var(--device-h);
  flex:none;
  margin-bottom:calc(-1 * var(--bleed));
  padding:var(--bezel);
  border-radius:calc(var(--radius) + var(--bezel));
  /* A brighter bezel on the dark frames. The same near-black rail that reads as a device against a
     cream backdrop simply vanishes against an espresso one — the screen ends up looking like a hole cut
     in the background rather than a phone sitting in front of it. The rim light is doing the work the
     drop shadow does on the light frames. */
  background:${
    dark
      ? 'linear-gradient(158deg, #7A6650 0%, #43362４ 46%, #241C14 100%)'.replace('４', '4')
      : `linear-gradient(158deg, #4A3B28 0%, ${C.espresso} 46%, #17120D 100%)`
  };
  /* Two shadows, not one: a wide soft pool that lifts the device off the gradient, and a tight dark one
     under the top edge so the bezel reads as having thickness rather than as a printed outline. */
  box-shadow:
    0 calc(var(--u) * 4.2) calc(var(--u) * 8.6) calc(var(--u) * -2.2) rgba(20,14,8,${dark ? 0.72 : 0.4}),
    0 calc(var(--u) * 1) calc(var(--u) * 2.2) rgba(20,14,8,${dark ? 0.5 : 0.18}),
    inset 0 0 0 1px rgba(247,244,239,${dark ? 0.22 : 0.12});
}
.screen {
  width:100%; height:100%;
  border-radius:var(--radius);
  overflow:hidden;
  background:${C.canvas};
}
.screen img {
  width:100%; height:100%;
  object-fit:cover; object-position:top center;
  display:block;
  /* No per-frame vertical crop. The capture and the screen cutout share one aspect ratio, so any
     zoom that trims the top trims the sides by the same factor — which on the composer shot ate the
     first letter of every line. Cropping vertically alone would mean a shorter device for that one
     frame, and a stubbier phone in the middle of the set is a worse artefact than the sliver of
     dimmed backdrop above a modal sheet, which is what the app actually looks like there. */
}

/* ── Statement frame ────────────────────────────────────────────────────── */
.statement {
  position:relative; z-index:2;
  flex:1;
  padding:0 calc(var(--u) * 9);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; text-align:center;
  gap:calc(var(--u) * 3);
  /* Optically centred, not mathematically. With the block dead-centre the eye reads it as sitting low,
     because the frame below it is empty and the frame above it is not — the wordmark, the headline and
     the badges are all top-weighted. A nudge up of a few percent of the height fixes that; the pinned
     footer then occupies the space that nudge opens at the bottom. */
  padding-bottom:calc(var(--u) * 12);
}
.statement .mark {
  width:calc(var(--u) * 20); height:calc(var(--u) * 20);
  border-radius:calc(var(--u) * 5);
  margin-bottom:calc(var(--u) * 2.6);
  box-shadow:
    0 calc(var(--u) * 2.6) calc(var(--u) * 6) calc(var(--u) * -1.4) rgba(20,14,8,0.6),
    0 0 0 1px rgba(247,244,239,0.16);
}
.statement h1 { font-size:calc(var(--u) * 9); }
.statement .sub { max-width:calc(var(--u) * 72); }

.badges {
  display:flex; flex-wrap:wrap; justify-content:center;
  gap:calc(var(--u) * 1.8);
  margin-top:calc(var(--u) * 2.4);
}
.badges span {
  font-size:calc(var(--u) * 2.45); font-weight:500;
  color:${dark ? C.creamInk : C.ink};
  padding:calc(var(--u) * 1.3) calc(var(--u) * 3);
  border-radius:999px;
  background:rgba(${dark ? '247,244,239,0.07' : '255,255,255,0.55'});
  box-shadow:inset 0 0 0 1px rgba(${dark ? '247,244,239,0.16' : '44,36,22,0.10'});
}
.footer {
  margin-top:calc(var(--u) * 5.5);
  font-size:calc(var(--u) * 2.6); font-weight:500;
  letter-spacing:calc(var(--u) * 0.12);
  color:${accent};
}
.statement .footer {
  /* Pinned rather than flowed. In the flow it sits directly under the badges and leaves the bottom
     fifth of the frame empty, which on a 2796px canvas is a lot of nothing. */
  position:absolute; left:0; right:0;
  bottom:calc(var(--u) * 7.5);
  margin-top:0;
}
.statement .footer::before {
  content:'';
  display:block; width:calc(var(--u) * 9); height:2px;
  margin:0 auto calc(var(--u) * 3.4);
  background:${dark ? 'rgba(247,244,239,0.22)' : 'rgba(44,36,22,0.18)'};
}
</style></head>
<body>
${watermark(frame.theme, width)}
${body}
</body></html>`
}

/**
 * The Play listing's feature graphic — 1024x500, landscape, and the one asset that is not a screenshot.
 *
 * Google crops and overlays this in several places, so nothing load-bearing goes near an edge and the
 * whole composition is centred.
 */
function featureHtml() {
  const width = 1024
  const height = 500
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
${FONT_CSS}
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:${width}px; height:${height}px; overflow:hidden; }
body {
  --u: ${width / 100}px;
  position:relative;
  ${backdrop('dark')}
  font-family:'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing:antialiased;
  display:flex; align-items:center; justify-content:center; gap:calc(var(--u) * 3.4);
  padding:0 calc(var(--u) * 7);
}
.watermark { position:absolute; pointer-events:none; }
.mark {
  width:calc(var(--u) * 13); height:calc(var(--u) * 13);
  border-radius:calc(var(--u) * 3.2);
  box-shadow:0 calc(var(--u) * 1.2) calc(var(--u) * 3) rgba(20,14,8,0.55), 0 0 0 1px rgba(247,244,239,0.14);
  flex:none;
}
.copy { position:relative; z-index:2; }
h1 {
  font-family:'Newsreader', Georgia, serif;
  font-weight:700; font-size:calc(var(--u) * 6.6); line-height:1.05;
  letter-spacing:calc(var(--u) * -0.1);
  color:${C.creamInk};
}
h1 em { font-style:normal; color:#DCAB71; }
p {
  margin-top:calc(var(--u) * 1.6);
  font-size:calc(var(--u) * 2.35); line-height:1.4; color:${C.creamMuted};
  max-width:calc(var(--u) * 58);
}
</style></head>
<body>
${watermark('dark', width)}
${ICON_URI ? `<img class="mark" src="${ICON_URI}" alt=""/>` : ''}
<div class="copy">
  <h1>Don’t swipe. <em>Search.</em></h1>
  <p>The open-source directory for finding your people. Searchable by values, readable end to end, yours to keep.</p>
</div>
</body></html>`
}

// ─── Render ───────────────────────────────────────────────────────────────────

const selected = FRAMES.filter((f, i) => ONLY.length === 0 || ONLY.includes(String(i + 1)) || ONLY.includes(f.key))
const ALL = TARGET === 'all' || TARGET === 'both'
const targets = ALL ? Object.values(TARGETS) : [TARGETS[TARGET]]
if (targets.some((t) => !t)) {
  console.error(`--target must be one of: ${Object.keys(TARGETS).join(', ')}, all`)
  process.exit(1)
}

mkdirSync(WORK_DIR, {recursive: true})

const browser = await pw.chromium.launch()
const missingShots = []

for (const target of targets) {
  const outDir = join(OUT_ROOT, target.dir)
  mkdirSync(outDir, {recursive: true})
  console.log(`\n${target.label} — ${target.width}x${target.height}`)

  const page = await browser.newPage({
    viewport: {width: target.width, height: target.height},
    deviceScaleFactor: 1,
  })

  for (const [i, frame] of selected.entries()) {
    const n = String(FRAMES.indexOf(frame) + 1).padStart(2, '0')
    if (frame.shot && !existsSync(join(RAW_DIR, frame.theme, frame.shot))) {
      missingShots.push(`${frame.theme}/${frame.shot}`)
      console.warn(`  – ${n}-${frame.key}: no raw/${frame.theme}/${frame.shot} yet, skipped`)
      continue
    }
    // Written next to raw/ so the <img src="raw/..."> is a same-directory relative path; the fonts and
    // the icon are already inlined, so this file is the only thing on disk the page needs.
    const htmlPath = join(WORK_DIR, `.frame-${target.dir}-${frame.key}.html`)
    writeFileSync(htmlPath, frameHtml(frame, target))
    await page.goto(`file://${htmlPath}`, {waitUntil: 'load'})
    // Before anything is measured. Newsreader is a good deal tighter than the fallback serif, so a
    // header measured mid-swap is a header measured for the wrong typeface.
    await page.evaluate(() => document.fonts.ready)

    if (frame.kind !== 'statement') {
      const headerH = await page.evaluate(
        () => document.querySelector('.header').getBoundingClientRect().height,
      )
      const g = fitDevice({width: target.width, height: target.height, headerH, bleed: target.bleed ?? 0.1})
      // What the device actually left. Never less than the type needs — fitDevice derives the device
      // from `headerH` and only ever shrinks it further against the width cap.
      g.headerH = Math.max(headerH, Math.round(target.height - g.deviceH * 0.9))
      await page.evaluate((vars) => {
        const s = document.body.style
        s.setProperty('--device-w', `${vars.deviceW}px`)
        s.setProperty('--device-h', `${vars.deviceH}px`)
        s.setProperty('--bezel', `${vars.bezel}px`)
        s.setProperty('--radius', `${vars.radius}px`)
        s.setProperty('--bleed', `${vars.bleedPx}px`)
        s.setProperty('--header-h', `${vars.headerH}px`)
        s.setProperty('--header-justify', 'center')
      }, g)
      // A headline that wraps to three lines eats the frame from the top. The phone still bleeds
      // correctly, it just gets small — which is the one failure this layout cannot detect visually,
      // because every other proportion still looks deliberate.
      if (g.deviceW < target.width * (target.minDeviceRatio ?? 0.55)) {
        console.warn(
          `  ! ${frame.key}: device is only ${Math.round((g.deviceW / target.width) * 100)}% of the ` +
            `frame width (header ${Math.round(headerH)}px) — the headline is probably too long.`,
        )
      }
    }

    await page
      .evaluate(() => Promise.all(Array.from(document.images).map((im) => im.decode().catch(() => {}))))
      .catch(() => {})
    await page.waitForTimeout(120)
    const file = join(outDir, `${n}-${frame.key}.png`)
    await page.screenshot({path: file})
    console.log(`  ✓ ${n}-${frame.key}.png`)
  }

  await page.close()
}

if (WITH_FEATURE && (ALL || TARGET === 'play') && ONLY.length === 0) {
  const outDir = join(OUT_ROOT, 'play')
  mkdirSync(outDir, {recursive: true})
  const htmlPath = join(WORK_DIR, '.frame-feature.html')
  writeFileSync(htmlPath, featureHtml())
  const page = await browser.newPage({viewport: {width: 1024, height: 500}, deviceScaleFactor: 1})
  await page.goto(`file://${htmlPath}`, {waitUntil: 'load'})
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(120)
  await page.screenshot({path: join(outDir, 'feature-graphic.png')})
  await page.close()
  console.log('\nfeature graphic — 1024x500\n  ✓ feature-graphic.png')
}

await browser.close()

if (missingShots.length) {
  console.warn(
    `\nMissing raw captures: ${[...new Set(missingShots)].join(', ')}\n` +
      `Most of those need a signed-in session. Run:\n` +
      `  node media-creator/scripts/capture-store.mjs --login   # once, sign in, close the window\n` +
      `  node media-creator/scripts/capture-store.mjs\n` +
      `  node media-creator/scripts/capture-store.mjs --theme dark`,
  )
}

console.log(`\noutput -> media-creator/out/store/`)
