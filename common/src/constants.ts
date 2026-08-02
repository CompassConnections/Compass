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
