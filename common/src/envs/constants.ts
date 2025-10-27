import {DEV_CONFIG} from './dev'
import {PROD_CONFIG} from './prod'
import {isProd} from "common/envs/is-prod";

export const MAX_DESCRIPTION_LENGTH = 100000
export const MAX_ANSWER_LENGTH = 240

export const IS_LOCAL_ANDROID = process.env.NEXT_PUBLIC_LOCAL_ANDROID !== undefined
console.log('IS_LOCAL_ANDROID', IS_LOCAL_ANDROID)

export const LOCAL_WEB_DOMAIN = `localhost:3000`
export const LOCAL_BACKEND_DOMAIN = `${IS_LOCAL_ANDROID ? '10.0.2.2' : 'localhost'}:8088`

export const IS_GOOGLE_CLOUD = !!process.env.GOOGLE_CLOUD_PROJECT
export const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL
export const IS_DEPLOYED = IS_GOOGLE_CLOUD || IS_VERCEL
export const IS_LOCAL = !IS_DEPLOYED
export const HOSTING_ENV = IS_GOOGLE_CLOUD ? 'Google Cloud' : IS_VERCEL ? 'Vercel' : IS_LOCAL ? 'local' : 'unknown'

if (IS_LOCAL && !process.env.ENVIRONMENT && !process.env.NEXT_PUBLIC_FIREBASE_ENV) {
  console.warn("No ENVIRONMENT set, defaulting to DEV")
  process.env.ENVIRONMENT = 'DEV'
}

export const ENV_CONFIG = isProd() ? PROD_CONFIG : DEV_CONFIG

export function isAdminId(id: string) {
  return ENV_CONFIG.adminIds.includes(id)
}

export function isModId(id: string) {
  return MOD_USERNAMES.includes(id)
}

export const ENV = isProd() ? 'prod' : 'dev'
export const IS_PROD = ENV === 'prod'
export const IS_DEV = ENV === 'dev'

console.debug(`Running in ${HOSTING_ENV} (${ENV})`,);

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

export const DOMAIN = IS_LOCAL ? LOCAL_WEB_DOMAIN : ENV_CONFIG.domain
export const BACKEND_DOMAIN = IS_LOCAL ? LOCAL_BACKEND_DOMAIN : ENV_CONFIG.backendDomain
export const FIREBASE_CONFIG = ENV_CONFIG.firebaseConfig
export const PROJECT_ID = ENV_CONFIG.firebaseConfig.projectId

export const AUTH_COOKIE_NAME = `FBUSER_${PROJECT_ID.toUpperCase().replace(
  /-/g,
  '_'
)}`

export const MOD_USERNAMES = [
  'Martin',
]

export const VERIFIED_USERNAMES = [
  'Martin',
]

export const TEN_YEARS_SECS = 60 * 60 * 24 * 365 * 10

export const RESERVED_PATHS = [
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
  'notifications',
  'og-test',
  'organization',
  'payments',
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
  'twitter',
  'user',
  'users',
  'web',
  'welcome',
]

export function getStorageBucketId() {
  return ENV_CONFIG.firebaseConfig.storageBucket
}