// Compass brand tokens, mirrored from web/styles/globals.css and the logo artwork.
// Keep these in sync if the web palette changes.
export const colors = {
  // Warm neutrals
  cream: '#F7F4EF', // canvas-50 — cards / light surfaces
  creamGlow: '#FAF3E9', // primary-50 — subtle glow tint
  ink: '#1E1A14', // ink-900 — deep warm black
  espresso: '#2C2416', // canvas-950 — dark espresso
  espressoDeep: '#0F0D0A', // deepest depth

  // Primary amber ramp (primary-500 base)
  amber: '#C17F3E',
  amberLight: '#D09352', // primary-400
  amberBright: '#DCAB71', // primary-300
  amberDeep: '#A6682E', // primary-600

  // Accents pulled straight from the compass logo
  logoBlue: '#1D384B',
  logoRed: '#E94734',

  // Light-surface ramp, matching the per-profile OG card (web/pages/api/og/profile.tsx)
  canvas100: '#EDE8E0', // canvas-100 — page background
  canvas200: '#E8D5BC', // canvas-200 — tag pills / warm dividers
  ink600: '#786C5C', // ink-600 — secondary text
  ink500: '#8C8070', // ink-500 — tertiary text
  amberPale: '#F3E4CE', // primary-100
  amberEmber: '#855022', // primary-700 — text-safe amber on cream
} as const

// System-font stack only — no network fetch at render time, so renders are reproducible offline.
export const fonts = {
  display: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',

  // The real web faces (see web/pages/_document.tsx and tailwind.config.js). Only usable in a
  // scene that imports ./components/BrandFonts — that module loads the woff2 files from
  // public/fonts (`npm run fonts`) and blocks the render until they are ready.
  heading: '"Newsreader", Georgia, serif', // h1–h6 on the site
  body: '"DM Sans", "Segoe UI", sans-serif', // body copy
  wordmark: '"Cormorant Garamond", Georgia, serif', // the `.logo` wordmark
} as const

// Output formats. Same scenes, different canvas — layouts adapt via useVideoConfig().
//  - post:  4:5 portrait, the tallest ratio Instagram allows in-feed (primary).
//  - story: 9:16 vertical, full-screen Stories / Reels (secondary).
//  - og:    1.91:1, the OpenGraph / Twitter `summary_large_image` card (a still, not a video).
export const FORMATS = {
  post: {width: 1080, height: 1350, fps: 30},
  story: {width: 1080, height: 1920, fps: 30},
  og: {width: 1200, height: 630, fps: 30},
} as const

// Design reference height (the story format). Scenes are tuned against this;
// the shorter post format compacts where needed.
export const DESIGN_HEIGHT = FORMATS.story.height
