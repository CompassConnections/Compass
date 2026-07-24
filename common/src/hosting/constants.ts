export const IS_WEBVIEW_DEV_PHONE = process.env.NEXT_PUBLIC_WEBVIEW_DEV_PHONE === '1'
export const IS_LOCAL_ANDROID =
  IS_WEBVIEW_DEV_PHONE || process.env.NEXT_PUBLIC_LOCAL_ANDROID === '1'
export const IS_WEBVIEW = !!process.env.NEXT_PUBLIC_WEBVIEW
export const IS_GOOGLE_CLOUD = !!process.env.GOOGLE_CLOUD_PROJECT
export const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL
export const IS_DEPLOYED = IS_GOOGLE_CLOUD || IS_VERCEL || IS_WEBVIEW
export const IS_LOCAL = !IS_DEPLOYED
export const HOSTING_ENV = IS_GOOGLE_CLOUD
  ? 'Google Cloud'
  : IS_VERCEL
    ? 'Vercel'
    : IS_WEBVIEW
      ? 'WebView'
      : IS_LOCAL
        ? 'local'
        : 'unknown'

if (IS_LOCAL && !process.env.ENVIRONMENT && !process.env.NEXT_PUBLIC_FIREBASE_ENV) {
  console.warn('No ENVIRONMENT set, defaulting to DEV')
  process.env.ENVIRONMENT = 'DEV'
}

export const SENTRY_DSN =
  'https://4e5d3b0aa566e8aaae97298398a1ad37@o4510975610060800.ingest.de.sentry.io/4510975611699280'

export const PNG_LOGO = 'https://www.compassmeet.com/icons/icon-512x512.png'

/**
 * The default social preview card — what WhatsApp, X, Slack, LinkedIn etc. show for a shared
 * compassmeet.com link. 1200×630, the 1.91:1 `summary_large_image` slot.
 *
 * Rendered from media-creator (`npm run still:og`), stored in Cloudflare R2, and pulled into
 * web/public/images at build time by web/scripts/fetch-media.mjs — so it is served same-origin.
 *
 * The filename is versioned deliberately: WhatsApp and X cache a preview image *by URL* and
 * effectively never revalidate it. A redesign has to ship as `-v2`, otherwise every link already
 * shared keeps showing the old card forever.
 *
 * Absolute and hardcoded to prod (like PNG_LOGO above) because crawlers resolve it from wherever
 * the page is served — a preview deployment linking to its own ephemeral URL would rot.
 */
export const OG_CARD = {
  url: 'https://www.compassmeet.com/images/og-card-v1.jpg',
  type: 'image/jpeg',
  width: '1200',
  height: '630',
  alt: "Compass — Don't Swipe. Search. Find your people based on your values and interests.",
} as const

// console.log('IS_LOCAL_ANDROID', IS_LOCAL_ANDROID)
