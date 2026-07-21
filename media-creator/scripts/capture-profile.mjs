// Captures the section screenshots used by the profile-tour video.
//
// Shoots the public profile page at a phone-sized viewport (430×932 CSS px @ DPR 2,
// so every PNG is 2× and stays crisp on the 1080-wide canvas) and clips one image
// per profile section into public/profile/.
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
import {existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

import pw from '../../node_modules/@playwright/test/index.js';

const {chromium} = pw;

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const LOGIN = args.includes('--login');
const URL = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000/Martin';
const OUT_DIR = join(HERE, '..', 'public', 'profile');
const PROFILE_DIR = join(HERE, '..', '.auth-profile');

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
];

const PAD = 12; // CSS px of breathing room around each clip

mkdirSync(OUT_DIR, {recursive: true});

// One persistent context for both modes, so --login and the captures share a
// session. Headed only while logging in.
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: !LOGIN,
  viewport: {width: 430, height: 932},
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
const page = context.pages()[0] ?? (await context.newPage());

if (LOGIN) {
  console.log('\nA browser window is open. Sign in there yourself — this script never');
  console.log('handles your credentials. It waits until you land back on a signed-in page.\n');
  await page.goto('http://localhost:3000/signin', {timeout: 60000});
  await page.waitForURL((u) => !u.pathname.includes('signin'), {timeout: 300000});
  await page.waitForTimeout(3000);
  await context.close();
  console.log(`Session saved to ${PROFILE_DIR}. Re-run without --login to capture.`);
  process.exit(0);
}

if (!existsSync(join(PROFILE_DIR, 'Default'))) {
  console.log('No saved session — prompts and endorsements will be skipped.');
  console.log('Run with --login once to capture them.\n');
}

await page.goto(URL, {waitUntil: 'networkidle', timeout: 60000});
await page.waitForSelector('[data-testid="profile-content"]', {timeout: 30000});
// Photos are lazy next/image — walk the page top to bottom so every one of them
// starts loading, then come back up and let them decode.
await page.evaluate(async () => {
  const step = innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 150));
  }
  scrollTo(0, 0);
});
await page.waitForTimeout(2500);

// Anything pinned to the viewport (bottom nav, sticky top bar, sign-up CTA) would
// smear across a full-page capture — hide it, plus the CSS animations.
// The Next.js dev-tools badge lives in a shadow-DOM portal, so the sweep below
// can't see it — kill it by tag name instead.
await page.addStyleTag({
  content: `
    *, *::before, *::after { animation: none !important; transition: none !important; }
    nextjs-portal, #__next-build-watcher { display: none !important; }
  `,
});
await page.evaluate(() => {
  for (const el of document.querySelectorAll('body *')) {
    const pos = getComputedStyle(el).position;
    if (pos === 'fixed' || pos === 'sticky') el.style.display = 'none';
  }
});

// Absolute page rect for a node, padded, clamped to the document.
const rectOf = (selectorFn, arg) =>
  page.evaluate(
    ([fn, a, pad]) => {
      const el = new Function('a', `return (${fn})(a)`)(a);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = Math.max(0, r.left + scrollX - pad);
      const y = Math.max(0, r.top + scrollY - pad);
      return {
        x,
        y,
        width: Math.min(r.width + pad * 2, document.documentElement.scrollWidth - x),
        height: r.height + pad * 2,
      };
    },
    [selectorFn.toString(), arg, PAD],
  );

const shoot = async (file, clip) => {
  if (!clip) {
    console.warn(`  ✗ ${file} — element not found, skipped`);
    return;
  }
  const path = join(OUT_DIR, file);
  await page.screenshot({path, fullPage: true, clip});
  console.log(`  ✓ ${file}  ${Math.round(clip.width)}×${Math.round(clip.height)} CSS px`);
};

// 1 — header: avatar, name, location, chips, pull-quote.
await shoot(
  '01-header.png',
  await rectOf(() => document.querySelector('.animate-profile-appear')),
);

// 2..6 — one card per section, found by its heading text.
for (const [title, file] of CARDS) {
  await shoot(
    file,
    await rectOf((t) => {
      const cards = [...document.querySelectorAll('.bg-canvas-50.border-canvas-300.border')];
      return cards.find((c) => c.innerText.trim().startsWith(t));
    }, title),
  );
}

// 7 — photo carousel. Grab the scrolling row, not one slide: the clip is clamped
// to the page width, so it frames photo 1 with photo 2 peeking in — as in the app.
await shoot(
  '07-photos.png',
  await rectOf(() => document.querySelector('.snap-start')?.closest('[class*="overflow"]') ?? null),
);

// 8 — the whole page, for the establishing slow-scroll shot.
await page.screenshot({path: join(OUT_DIR, 'full.png'), fullPage: true});
console.log('  ✓ full.png  (full page, for the scroll shot)');

await context.close();
console.log(`\nWrote ${OUT_DIR}`);
