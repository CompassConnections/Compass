import {DEV_CONFIG} from './dev'
import {PROD_CONFIG} from './prod'
import {isProd} from "common/envs/is-prod";

export const MAX_DESCRIPTION_LENGTH = 16000
export const MAX_ANSWER_LENGTH = 240

export const ENV_CONFIG = isProd() ? PROD_CONFIG : DEV_CONFIG

export function isAdminId(id: string) {
  return ENV_CONFIG.adminIds.includes(id)
}

export function isModId(id: string) {
  return MOD_IDS.includes(id)
}

export const ENV = isProd() ? 'prod' : 'dev'
export const IS_PROD = ENV === 'prod'
export const IS_DEV = ENV === 'dev'

export const LOCAL_WEB_DOMAIN = 'localhost:3000';
export const LOCAL_BACKEND_DOMAIN = 'localhost:8088';

export const IS_GOOGLE_CLOUD = !!process.env.GOOGLE_CLOUD_PROJECT
export const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL
export const IS_LOCAL = !IS_GOOGLE_CLOUD && !IS_VERCEL
export const HOSTING_ENV = IS_GOOGLE_CLOUD ? 'Google Cloud' : IS_VERCEL ? 'Vercel' : IS_LOCAL ? 'local' : 'unknown'
console.log(`Running in ${HOSTING_ENV} (${ENV})`,);

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

export const MOD_IDS = [
  '...',
]

export const VERIFIED_USERNAMES = [
  'Martin',
]

export const TEN_YEARS_SECS = 60 * 60 * 24 * 365 * 10

export const RESERVED_PATHS = [
  '_next',
  'about',
  'ad',
  'add-funds',
  'ads',
  'admin',
  'analytics',
  'api',
  'browse',
  'career',
  'careers',
  'chat',
  'chats',
  'common',
  'contact',
  'contacts',
  'create',
  'dashboard',
  'discord',
  'embed',
  'facebook',
  'find',
  'github',
  'google',
  'group',
  'groups',
  'help',
  'home',
  'link',
  'linkAccount',
  'links',
  'live',
  'login',
  'manifest',
  'market',
  'markets',
  'message',
  'messages',
  'notifications',
  'og-test',
  'payments',
  'privacy',
  'profile',
  'public',
  'questions',
  'referral',
  'referrals',
  'send',
  'server-sitemap',
  'sign-in',
  'sign-in-waiting',
  'sitemap',
  'slack',
  'stats',
  'styles',
  'team',
  'terms',
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