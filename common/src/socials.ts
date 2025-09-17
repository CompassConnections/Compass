export const SITE_ORDER = [
  'site', // personal site
  'x', // twitter
  'discord',
  'bluesky',
  'mastodon',
  'substack',
  'paypal',
  'instagram',
  'github',
  'linkedin',
  'facebook',
  'patreon',
  'spotify',
] as const

export type Site = (typeof SITE_ORDER)[number]

// this is a lie, actually people can have anything in their links
export type Socials = { [key in Site]?: string }

export const strip = (site: Site, input: string) =>
  stripper[site]?.(input) ?? input

const stripper: { [key in Site]: (input: string) => string } = {
  site: (s) => s.replace(/^(https?:\/\/)/, ''),
  x: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?(twitter|x)(\.com\/)/, '')
      .replace(/^@/, '')
      .replace(/\/$/, ''),
  discord: (s) => s,
  paypal: (s) => s,
  patreon: (s) => s,
  bluesky: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?bsky\.app\/profile\//, '')
      .replace(/^@/, '')
      .replace(/\/$/, ''),
  mastodon: (s) => s.replace(/^@/, ''),
  substack: (s) =>
    s
      .replace(/^(https?:\/\/)?(www\.)?(\w+\.)?substack\.com\//, '')
      .replace(/\/$/, ''),
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
    s
      .replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\//, '')
      .replace(/\/$/, ''),
  facebook: (s) =>
    s.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//, '').replace(/\/$/, ''),
  spotify: (s) =>
    s
      .replace(/^(https?:\/\/)?(open\.)?spotify\.com\/(artist|user)\//, '')
      .replace(/\/$/, ''),
}

export const getSocialUrl = (site: Site, handle: string) =>
  urler[site]?.(handle) ?? urler.site(handle)

const urler: { [key in Site]: (handle: string) => string } = {
  site: (s) => (s.startsWith('http') ? s : `https://${s}`),
  x: (s) => `https://x.com/${s}`,
  discord: (s) =>
    (s.length === 17 || s.length === 18) && !isNaN(parseInt(s, 10))
      ? `https://discord.com/users/${s}` // discord user id
      : 'https://discord.gg/8Vd7jzqjun', // our server
  bluesky: (s) => `https://bsky.app/profile/${s}`,
  mastodon: (s) =>
    s.includes('@') ? `https://${s.split('@')[1]}/@${s.split('@')[0]}` : s,
  substack: (s) => `https://${s}.substack.com`,
  instagram: (s) => `https://instagram.com/${s}`,
  github: (s) => `https://github.com/${s}`,
  linkedin: (s) => `https://linkedin.com/in/${s}`,
  facebook: (s) => `https://facebook.com/${s}`,
  spotify: (s) => `https://open.spotify.com/user/${s}`,
  paypal: (s) => `https://paypal.com/paypalme/${s}`,
  patreon: (s) => `https://patreon.com/user/${s}`,
}

export const PLATFORM_LABELS: { [key in Site]: string } = {
  site: 'Website',
  x: 'Twitter/X',
  discord: 'Discord',
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
}
