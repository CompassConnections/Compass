import {isProd} from 'common/envs/is-prod'
import {
  HOSTING_ENV,
  IS_LOCAL,
  IS_LOCAL_ANDROID,
  IS_WEBVIEW_DEV_PHONE,
} from 'common/hosting/constants'

import {DEV_CONFIG} from './dev'
import {PROD_CONFIG} from './prod'

export const MAX_DESCRIPTION_LENGTH = 100000
export const MAX_ANSWER_LENGTH = 240

export const ENV = isProd() ? 'prod' : 'dev'
export const IS_PROD = ENV === 'prod'
export const IS_DEV = ENV === 'dev'

export const ENV_CONFIG = IS_PROD ? PROD_CONFIG : DEV_CONFIG

export function isAdminId(id: string) {
  // if (IS_LOCAL) return true
  return isAdminUserId(id)
}

// Strict membership test against the admin list, with no local-dev escape hatch. `isAdminId` grants
// admin *powers* to everyone running locally, which is fine for gating a debug button but wrong for
// the visible admin badge: a badge that sits next to every name in dev is a badge nobody has
// calibrated on. Use this wherever the answer is shown to a reader rather than used to authorize.
export function isAdminUserId(id: string) {
  return ENV_CONFIG.adminIds.includes(id)
}

// Staff roles are keyed on user ids, never usernames. A username is released by a rename and can be
// registered again by anyone, so a badge or an exemption tied to one would follow the name to its
// next owner; an id stays with the account. Both lists are the admin list today because the founder
// is the only moderator — kept as their own names so a mod can be added without becoming an admin.
export const MOD_USER_IDS: string[] = ENV_CONFIG.adminIds
export const VERIFIED_USER_IDS: string[] = ENV_CONFIG.adminIds

export function isModId(id: string) {
  return MOD_USER_IDS.includes(id)
}

export function isVerifiedId(id: string) {
  return VERIFIED_USER_IDS.includes(id)
}

console.debug(`Running in ${HOSTING_ENV} (${ENV})`)

// class MissingKeyError implements Error {
//   constructor(key: string) {
//     this.message = `Missing ENV_CONFIG.${key} in ${ENV}. If you're running locally, you most likely want to run in dev mode: yarn dev.`
//     this.name = 'MissingKeyError'
//   }
//
//   message: string;
//   name: string;
// }

// for (const key of ['supabaseAnonKey', 'supabasePwd', 'googleApplicationCredentials'] as const) {
//   if (!(key in ENV_CONFIG) || ENV_CONFIG[key as keyof typeof ENV_CONFIG] == null) {
//     throw new MissingKeyError(key)
//   }
// }
// if (!ENV_CONFIG.firebaseConfig.apiKey) {
//   throw new MissingKeyError('firebaseConfig.apiKey')
// }

export const IS_FIREBASE_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'
if (IS_FIREBASE_EMULATOR) console.debug('Using Firebase emulator.')

export const LOCAL_WEB_DOMAIN = `localhost:3000`
export const LOCAL_BACKEND_DOMAIN = `${IS_WEBVIEW_DEV_PHONE ? '192.168.1.3' : IS_LOCAL_ANDROID ? '10.0.2.2' : 'localhost'}:8088`

export const DOMAIN = IS_LOCAL ? LOCAL_WEB_DOMAIN : ENV_CONFIG.domain
export const DEPLOYED_WEB_URL = `https://www.${PROD_CONFIG.domain}`

// Careful: buildOgUrl uses WEB_URL and works only on https://www.compassmeet.com (not https://compassmeet.com)
// x-vercel-error: INVALID_IMAGE_OPTIMIZE_REQUEST. Could work if needed though with some Vercel tweak
export const WEB_URL = IS_LOCAL ? `http://${LOCAL_WEB_DOMAIN}` : `https://${DOMAIN}`

export const BACKEND_DOMAIN = IS_LOCAL ? LOCAL_BACKEND_DOMAIN : ENV_CONFIG.backendDomain
export const FIREBASE_CONFIG = ENV_CONFIG.firebaseConfig
export const PROJECT_ID = ENV_CONFIG.firebaseConfig.projectId

export const FIREBASE_STORAGE_URL = IS_FIREBASE_EMULATOR
  ? 'http://localhost:9199'
  : `https://firebasestorage.googleapis.com`

export const REDIRECT_URI = `${WEB_URL}/auth/callback`

export const AUTH_COOKIE_NAME = `FBUSER_${PROJECT_ID.toUpperCase().replace(/-/g, '_')}`

// Measured after `cleanUsername`, so a name padded out with characters that get stripped does not
// pass. Short usernames are not only a UX matter: anything that treats the username as a storage
// prefix (see `deleteUserFiles`) gets more dangerous the shorter the name is.
export const MIN_USERNAME_LENGTH = 3

export const TEN_YEARS_SECS = 60 * 60 * 24 * 365 * 10

export const endTitle = IS_PROD ? 'Compass' : 'Compass dev'

// Routes, which therefore cannot be usernames. The profile page treats everything in here as "not a
// username" and 404s it, so this is not the place for a name that must keep resolving to a profile.
export const RESERVED_PATHS = new Set([
  '',
  '404',
  '_app',
  '_document',
  '_next',
  'about',
  'ad',
  'add-funds',
  'admin',
  'ads',
  'analytics',
  'api',
  'blog',
  'browse',
  'career',
  'careers',
  'charts',
  'chat',
  'chats',
  'common',
  'compatibility',
  'confirm-email',
  'contact',
  'contacts',
  'create',
  'dashboard',
  'discord',
  'embed',
  'events',
  'facebook',
  'faq',
  'financials',
  'find',
  'github',
  'google',
  'group',
  'groups',
  'help',
  'home',
  'index',
  'instagram',
  'json',
  'kofi',
  'liberapay',
  'link',
  'linkAccount',
  'links',
  'live',
  'login',
  'questions',
  'manifest',
  'market',
  'markets',
  'md',
  'members',
  'message',
  'messages',
  'monitoring',
  'notifications',
  'og-test',
  'organization',
  'patreon',
  'payments',
  'paypal',
  'privacy',
  'profile',
  'public',
  'questions',
  'referral',
  'referrals',
  'register',
  'send',
  'server-sitemap',
  'sign-in',
  'sign-in-waiting',
  'signin',
  'signup',
  'sitemap',
  'slack',
  'social',
  'stats',
  'styles',
  'support',
  'team',
  'terms',
  'tips-bio',
  'twitch',
  'x',
  'user',
  'users',
  'web',
  'welcome',
])

export function getStorageBucketId() {
  return ENV_CONFIG.firebaseConfig.storageBucket
}
