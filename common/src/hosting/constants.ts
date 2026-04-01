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

export const PNG_FAVICON = 'https://www.compassmeet.com/icons/icon-192x192.png'

// console.log('IS_LOCAL_ANDROID', IS_LOCAL_ANDROID)
