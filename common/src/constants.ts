export const MIN_INT = Number.MIN_SAFE_INTEGER
export const MAX_INT = Number.MAX_SAFE_INTEGER

export const supportEmail = 'hello@compassmeet.com'
// export const marketingEmail = 'hello@compassmeet.com'

export const githubRepoSlug = 'CompassConnections/Compass'
export const githubRepo = `https://github.com/${githubRepoSlug}`
export const githubIssues = `${githubRepo}/issues`

export const paypalLink = 'https://www.paypal.com/paypalme/CompassConnections'
export const openCollectiveLink = 'https://opencollective.com/compass-connection'
export const liberapayLink = 'https://liberapay.com/CompassConnections'
export const kofiLink = 'https://ko-fi.com/compassconnections'
export const patreonLink = 'https://patreon.com/CompassMeet'
export const discordLink = 'https://discord.gg/8Vd7jzqjun'
export const stoatLink = 'https://stt.gg/YKQp81yA'
export const redditLink = 'https://www.reddit.com/r/CompassConnect'
export const xLink = 'https://x.com/compassmeet'
export const instagramLink = 'https://www.instagram.com/compassmeet/'
export const mastodonLink = 'https://mastodon.social/@compassmeet'
export const formLink = 'https://forms.gle/tKnXUMAbEreMK6FC6'
export const ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=com.compassconnections.app'
/**
 * App Store listing. The numeric id is assigned by App Store Connect when the app record is
 * created, so this is a placeholder until the first submission — see `docs/ios.md` §7. Anything
 * linking here should be gated on `IOS_APP_URL` no longer containing `APPLE_ID`.
 */
export const IOS_APP_URL = 'https://apps.apple.com/app/compass/idAPPLE_ID'
export const IS_IOS_APP_PUBLISHED = !IOS_APP_URL.includes('APPLE_ID')

/**
 * Just the numeric id out of `IOS_APP_URL`, which is the form the Smart App Banner meta tag wants
 * (`web/components/SEO.tsx`). Derived rather than written out a second time so the placeholder can
 * only be replaced in one place — a banner pointing at a stale id advertises somebody else's app,
 * which is exactly what this repo used to do with a leftover from the fork it started as.
 * Undefined until the listing exists; anything using it must handle that.
 */
export const IOS_APP_ID = IS_IOS_APP_PUBLISHED
  ? IOS_APP_URL.split('/id')[1]?.split(/[?#]/)[0]
  : undefined

/**
 * What Compass has cost and what it has been given, in USD, since launch.
 *
 * Lives here rather than in either page because the home strip and the about page both state it, and two
 * copies of a number that is the whole point of the transparency argument would be the one place it must
 * not drift. The authoritative breakdown is `web/public/md/financials.md` and the spreadsheet it links;
 * update all of them together.
 *
 * Not queried live: unlike the member count there is no endpoint behind it, and inventing one to avoid a
 * constant would put a bookkeeping figure on a page-load path.
 */
export const FINANCIALS = {
  spent: 457,
  donated: 145,
  /** Covered out of pocket by the founder — kept derived so it can never disagree with the two above. */
  get deficit() {
    return this.spent - this.donated
  },
}

export const IS_MAINTENANCE = false // set to true to enable the maintenance mode banner

export const MIN_BIO_LENGTH = 250

export const WEB_GOOGLE_CLIENT_ID =
  '253367029065-khkj31qt22l0vc3v754h09vhpg6t33ad.apps.googleusercontent.com'
// export const ANDROID_GOOGLE_CLIENT_ID = '253367029065-s9sr5vqgkhc8f7p5s6ti6a4chqsrqgc4.apps.googleusercontent.com'
export const GOOGLE_CLIENT_ID = WEB_GOOGLE_CLIENT_ID

/**
 * iOS OAuth client from Google Cloud Console (type "iOS", bundle id `com.compassconnections.app`).
 * Unlike Android — where the client is matched by package name + signing fingerprint and never named
 * in code — the iOS Google SDK needs its own client id passed in, plus the *reversed* form of it
 * registered as a `CFBundleURLSchemes` entry in `ios/App/App/Info.plist`. Both must be filled in
 * together; see `docs/ios.md` §4.4.
 *
 * Placeholder until the client is created. `googleNativeLogin` still passes `webClientId`, which is
 * what Firebase verifies the resulting idToken against, so this is only the native half.
 */
export const IOS_GOOGLE_CLIENT_ID =
  '253367029065-0mkes046pjqfn3l5o3lpap1jd3jigmea.apps.googleusercontent.com'
export const HAS_IOS_GOOGLE_CLIENT_ID = !IOS_GOOGLE_CLIENT_ID.startsWith('IOS_GOOGLE_CLIENT_ID')

/**
 * Apple *Services ID* — the identifier for Sign in with Apple on the web, as opposed to the App ID
 * the native iOS flow uses. Created in the Apple Developer portal and pasted into Firebase Console →
 * Authentication → Apple → Services ID; see `docs/ios.md` §5.2.
 *
 * The value is never sent from the client — `signInWithPopup` goes through Firebase's
 * `__/auth/handler`, which holds it server-side. It lives here purely as the build-time signal for
 * `canAppleLogin()`: while it is the placeholder, the browser has no working Apple flow and the
 * button must stay hidden, because rendering it would offer users a route that dead-ends in an
 * `auth/operation-not-allowed`. Filling it in is what turns the web button on.
 *
 * Why this matters beyond parity: an account created with Apple in the iOS app has `apple.com` as
 * its only provider and usually a `@privaterelay.appleid.com` address. Without a browser flow that
 * person cannot sign in on desktop at all, and password reset cannot rescue them — there is no
 * password.
 */
export const APPLE_SERVICES_ID = 'com.compassconnections.web'
export const HAS_APPLE_SERVICES_ID = !APPLE_SERVICES_ID.startsWith('APPLE_SERVICES_ID')

export const defaultLocale = 'en'
export const LOCALES = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  // es: "Español",
} as const

export const supportedLocales = Object.keys(LOCALES)
export type Locale = (typeof supportedLocales)[number]

//Exported types for test files to use when referencing the keys of the choices objects
export type LocaleTuple = {
  [K in keyof typeof LOCALES]: [K, (typeof LOCALES)[K]]
}[keyof typeof LOCALES]

export const OG_DESCRIPTION =
  'The free directory to find your people — fully searchable by values and demographics. No ads, no swipes.'
