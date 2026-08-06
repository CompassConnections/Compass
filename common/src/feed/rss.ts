import {FeedItem} from 'common/feed/feed'

/**
 * RSS 2.0 rendering for the new-profile feed. Pure string work, no I/O — the caller fetches the items
 * (already projected down to what each member allows, see `feed.ts`) and hands them over.
 *
 * RSS rather than Atom or JSON Feed because step two of the fediverse plan is an off-the-shelf
 * RSS→ActivityPub bridge, and RSS is the format every one of them takes.
 */

// XML 1.0 forbids most C0 control characters outright — a stray one anywhere in a bio makes the whole
// document unparseable, and bios are free text. Drop them before escaping.
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

export function escapeXml(text: string): string {
  return text
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RSS dates are RFC-822. `toUTCString()` emits exactly that shape. */
export function toRfc822(iso: string | Date): string {
  return new Date(iso).toUTCString()
}

export const feedItemUrl = (siteUrl: string, username: string) =>
  `${siteUrl.replace(/\/$/, '')}/${encodeURIComponent(username)}`

/** Append query parameters to a URL that may or may not already have some. */
export function withParams(url: string, params?: Record<string, string>): string {
  const entries = Object.entries(params ?? {})
  if (!entries.length) return url
  const query = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return `${url}${url.includes('?') ? '&' : '?'}${query}`
}

/** `Name — City, Country`, falling back to the name alone. */
export function feedItemTitle(item: FeedItem): string {
  return item.location ? `${item.name} — ${item.location}` : item.name
}

/**
 * Plain text, not HTML: an entry is a pointer to the profile, and every consumer (feed readers,
 * bridges, Mastodon timelines) renders plain text predictably while none of them agree on markup.
 */
export function feedItemDescription(item: FeedItem): string {
  const facts = [item.location, item.gender, item.keywords?.join(', ')].filter(Boolean)
  return [item.headline, facts.join(' · ') || undefined, item.bioExcerpt]
    .filter(Boolean)
    .join('\n\n')
}

export function renderFeedItem(
  item: FeedItem,
  siteUrl: string,
  trackingParams?: Record<string, string>,
): string {
  const url = feedItemUrl(siteUrl, item.username)
  const description = feedItemDescription(item)
  return [
    '    <item>',
    `      <title>${escapeXml(feedItemTitle(item))}</title>`,
    `      <link>${escapeXml(withParams(url, trackingParams))}</link>`,
    // The profile URL is stable and unique per member, so it doubles as the guid — *without* the
    // tracking parameters. Bridges dedupe on the guid: derive it from anything that can change (a
    // title, a date, a campaign name) and every edit reposts the member to every follower.
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `      <pubDate>${toRfc822(item.createdTime)}</pubDate>`,
    description ? `      <description>${escapeXml(description)}</description>` : undefined,
    '    </item>',
  ]
    .filter(Boolean)
    .join('\n')
}

export function renderRssFeed(props: {
  title: string
  description: string
  /** Absolute URL of the feed itself — required for `atom:link rel="self"`. */
  feedUrl: string
  /** Human-facing page the feed mirrors. */
  siteUrl: string
  linkUrl: string
  language?: string
  items: FeedItem[]
  /**
   * Query parameters appended to every outbound *link* (never to a `<guid>`) so arrivals from the feed
   * are attributable — which is the whole measurement half of "point a bridge at it and see whether it
   * converts". UTM parameters are what PostHog picks up off the landing pageview by itself.
   */
  trackingParams?: Record<string, string>
  /** Defaults to the newest item's date, so an unchanged feed keeps a stable `lastBuildDate`. */
  lastBuildDate?: string | Date
}): string {
  const {
    title,
    description,
    feedUrl,
    siteUrl,
    linkUrl,
    language = 'en',
    items,
    trackingParams,
  } = props
  const lastBuildDate = props.lastBuildDate ?? items[0]?.createdTime

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(withParams(linkUrl, trackingParams))}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${escapeXml(language)}</language>`,
    lastBuildDate ? `    <lastBuildDate>${toRfc822(lastBuildDate)}</lastBuildDate>` : undefined,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...items.map((item) => renderFeedItem(item, siteUrl, trackingParams)),
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}
