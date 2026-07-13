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
} as const;

// System-font stack only — no network fetch at render time, so renders are reproducible offline.
export const fonts = {
  display:
    '"Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
} as const;

// Output formats. Same scenes, different canvas — layouts adapt via useVideoConfig().
//  - post:  4:5 portrait, the tallest ratio Instagram allows in-feed (primary).
//  - story: 9:16 vertical, full-screen Stories / Reels (secondary).
export const FORMATS = {
  post: {width: 1080, height: 1350, fps: 30},
  story: {width: 1080, height: 1920, fps: 30},
} as const;

// Design reference height (the story format). Scenes are tuned against this;
// the shorter post format compacts where needed.
export const DESIGN_HEIGHT = FORMATS.story.height;
