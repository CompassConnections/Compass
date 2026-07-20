import {discordLink} from 'common/constants'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'

export const SITE_ORDER = [
  'site', // personal site
  'x', // twitter
  'discord',
  'signal',
  'bluesky',
  'mastodon',
  'substack',
  'paypal',
  'instagram',
  'github',
  'linkedin',
  'facebook',
  'patreon',
  'okcupid',
  'calendly',
  'datingdoc',
  'friendshipdoc',
  'connectiondoc',
  'workdoc',
  'spotify',
] as const

export type Site = (typeof SITE_ORDER)[number]

// this is a lie, actually people can have anything in their links
export type SocialValue = string | string[] | null | undefined
export type Socials = {[key: string]: SocialValue}

export const MULTI_VALUE_SITES = ['site'] as const

export const isMultiValueSite = (site: string) =>
  (MULTI_VALUE_SITES as readonly string[]).includes(site)

export const getSocialLinkValues = (value: SocialValue) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

export const getSocialEntries = (links: Socials | null | undefined) =>
  Object.entries(links ?? {}).flatMap(([platform, value]) =>
    getSocialLinkValues(value).map((value, index) => ({platform, value, index})),
  )

export const strip = (site: Site, input: string) => stripper[site]?.(input) ?? input

const stripper: {[key in Site]: (input: string) => string} = {
  site: (s) => s.replace(/^(https?:\/\/)/, ''),
  x: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?(twitter|x)(\.com\/)/, '')
      .replace(/^@/, '')
      .replace(/\/$/, ''),
  discord: (s) => s,
  // strip a signal.me deep link down to the phone number / handle for display
  signal: (s) => s.replace(/^(https?:\/\/)?(www\.)?signal\.me\/#[a-z]+\//i, '').replace(/\/$/, ''),
  paypal: (s) =>
    s.replace(/^(https?:\/\/)?(www\.)?(\w+\.)?paypal\.com\/paypalme\//, '').replace(/\/$/, ''),
  patreon: (s) => s.replace(/^(https?:\/\/)?(www\.)?(\w+\.)?patreon\.com\//, '').replace(/\/$/, ''),
  okcupid: (s) => s.replace(/^(https?:\/\/)/, ''),
  calendly: (s) => s,
  datingdoc: (s) => s,
  friendshipdoc: (s) => s,
  workdoc: (s) => s,
  connectiondoc: (s) => s,
  bluesky: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?bsky\.app\/profile\//, '')
      .replace(/^@/, '')
      .replace(/\/$/, ''),
  mastodon: (s) => s.replace(/^@/, ''),
  substack: (s) =>
    s.replace(/^(https?:\/\/)?(www\.)?(\w+\.)?substack\.com\//, '').replace(/\/$/, ''),
  instagram: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
      .replace(/^@/, '')
      .replace(/\/$/, ''),
  github: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')
      .replace(/^@/, '')
      .replace(/\/$/, ''),
  linkedin: (s) =>
    s.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\//, '').replace(/\/$/, ''),
  facebook: (s) => s.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '').replace(/\/$/, ''),
  spotify: (s) =>
    s.replace(/^(https?:\/\/)?(open\.)?spotify\.com\/(artist|user)\//, '').replace(/\/$/, ''),
}

export const getSocialUrl = (site: Site, handle: string) =>
  urler[site]?.(handle) ?? urler.site(handle)

const urler: {[key in Site]: (handle: string) => string} = {
  site: (s) => (s.startsWith('http') ? s : `https://${s}`),
  okcupid: (s) => (s.startsWith('http') ? s : `https://${s}`),
  x: (s) => (s.startsWith('http') ? s : `https://x.com/${s}`),
  discord: (s) =>
    (s.length === 17 || s.length === 18) && !isNaN(parseInt(s, 10))
      ? `https://discord.com/users/${s}` // discord user id
      : discordLink, // our server
  // signal.me deep links open the Signal app directly. Phone numbers use #p/,
  // a full pasted signal.me link (e.g. a username link, #eu/) is kept as-is.
  signal: (s) => {
    if (s.startsWith('http')) return s
    const cleaned = s.replace(/[\s()\-.]/g, '')
    if (/^\+?\d{7,15}$/.test(cleaned)) {
      return `https://signal.me/#p/${cleaned.startsWith('+') ? cleaned : `+${cleaned}`}`
    }
    return `https://signal.me/#p/${s}`
  },
  bluesky: (s) => `https://bsky.app/profile/${s}`,
  mastodon: (s) => (s.includes('@') ? `https://${s.split('@')[1]}/@${s.split('@')[0]}` : s),
  substack: (s) => (s.startsWith('http') ? s : `https://${s}.substack.com`),
  instagram: (s) => (s.startsWith('http') ? s : `https://instagram.com/${s}`),
  github: (s) => (s.startsWith('http') ? s : `https://github.com/${s}`),
  linkedin: (s) => (s.startsWith('http') ? s : `https://linkedin.com/in/${s}`),
  facebook: (s) => (s.startsWith('http') ? s : `https://facebook.com/${s}`),
  spotify: (s) => (s.startsWith('http') ? s : `https://open.spotify.com/user/${s}`),
  paypal: (s) => (s.startsWith('http') ? s : `https://paypal.com/paypalme/${s}`),
  patreon: (s) => (s.startsWith('http') ? s : `https://patreon.com/${s}`),
  calendly: (s) => (s.startsWith('http') ? s : `https://${s}`),
  datingdoc: (s) => (s.startsWith('http') ? s : `https://${s}`),
  friendshipdoc: (s) => (s.startsWith('http') ? s : `https://${s}`),
  workdoc: (s) => (s.startsWith('http') ? s : `https://${s}`),
  connectiondoc: (s) => (s.startsWith('http') ? s : `https://${s}`),
}

export const PLATFORM_LABELS: {[key in Site]: string} = {
  site: 'Website',
  x: 'Twitter/X',
  discord: 'Discord',
  signal: 'Signal',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  substack: 'Substack',
  instagram: 'Instagram',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  spotify: 'Spotify',
  paypal: 'Paypal',
  patreon: 'Patreon',
  okcupid: 'OkCupid',
  calendly: 'Calendly',
  datingdoc: 'Dating Doc',
  friendshipdoc: 'Friendship Doc',
  workdoc: 'Work Doc',
  connectiondoc: 'Connection Doc',
}

export function getXShareProfileUrl(
  t: (key: string, fallback: string, vars?: Record<string, string | number>) => string,
  username?: string,
) {
  const encodedText = encodeURIComponent(
    t(
      'share_profile.x_share_profile',
      "There's a free, open-source alternative to dating and networking apps.\nNo swipes. No ads. No algorithms. Just search for people who share your values.",
    ) + '\n@compassmeet',
  )
  const encodedUrl = encodeURIComponent(`${DEPLOYED_WEB_URL}/${username || ''}`)

  return `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
}
