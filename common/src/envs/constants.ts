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

export const DOMAIN = ENV_CONFIG.domain
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

export const LOCAL_WEB_URL = 'http://localhost:3000';
export const LOCAL_DEV = process.env.GOOGLE_CLOUD_PROJECT == null