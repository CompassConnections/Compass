import { DEV_CONFIG } from './dev'
import { EnvConfig, PROD_CONFIG } from './prod'

// Valid in web client & Vercel deployments only.
export const ENV = (process.env.NEXT_PUBLIC_FIREBASE_ENV ?? 'PROD') as
  | 'PROD'
  | 'DEV'

export const CONFIGS: { [env: string]: EnvConfig } = {
  PROD: PROD_CONFIG,
  DEV: DEV_CONFIG,
}

export const MAX_DESCRIPTION_LENGTH = 16000
export const MAX_ANSWER_LENGTH = 240

export const ENV_CONFIG = CONFIGS[ENV]

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
  'HTbxWFlzWGeHUTiwZvvF0qm8W433', // Conflux
  '9dAaZrNSx5OT0su6rpusDoG9WPN2', // dglid
  '5XMvQhA3YgcTzyoJRiNqGWyuB9k2', // dreev
  '2VhlvfTaRqZbFn2jqxk2Am9jgsE2', // Gabrielle
  'XeQf3ygmrGM1MxdsE3JSlmq8vL42', // Jacy
  'JlVpsgzLsbOUT4pajswVMr0ZzmM2', // Joshua
  'sA7V30Ic73XZtniboy2eKr6ekkn1', // MartinRandall
  'jO7sUhIDTQbAJ3w86akzncTlpRG2', // MichaelWheatley
  'lkkqZxiWCpOgtJ9ztJcAKz4d9y33', // NathanpmYoung
  'YOILpFNyg0gGj79zBIBUpJigHQ83', // SneakySly
  'KHX2ThSFtLQlau58hrjtCX7OL2h2', // shankypanky (stefanie)
]

export const VERIFIED_USERNAMES = [
  'ScottAlexander',
  'Aella',
  'Roko',
  'KatjaGrace',
  'patrissimo',
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
  'manifold',
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
