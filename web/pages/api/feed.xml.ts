import {DEPLOYED_WEB_URL, WEB_URL} from 'common/envs/constants'
import {MAX_FEED_LIMIT} from 'common/feed/feed'
import {renderRssFeed} from 'common/feed/rss'
import {IS_LOCAL} from 'common/hosting/constants'
import {debug} from 'common/logger'
import type {NextApiRequest, NextApiResponse} from 'next'
import {api} from 'web/lib/api'

/**
 * RSS feed of the newest public profiles, served at `/feed.xml` (rewritten in next.config.ts — this file
 * has to live under /api because a static-export build, the Android shell, cannot host a page that
 * writes its own response).
 *
 * `?country=Italy` narrows it to one country, which is the form worth subscribing to: the bottleneck is
 * local density, so a worldwide firehose would look like activity while every city stays empty.
 *
 * Members choose how much of their profile travels here (`profiles.feed_visibility`); the API applies
 * that per row, so this handler renders whatever it is given without knowing anyone's level.
 */
// `WEB_URL` is the bare apex (compassmeet.com), which 308-redirects to www — so every `<link>` and
// `<guid>` built from it would send readers through a redirect, and would disagree with the
// autodiscovery `<link rel="alternate">` in _app.tsx, which advertises www. Two spellings of the same
// feed is a dedupe hazard: a bridge that registered one and later saw the other would repost everyone.
const SITE_URL = IS_LOCAL ? WEB_URL : DEPLOYED_WEB_URL

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const country = typeof req.query.country === 'string' ? req.query.country.trim() : undefined
  const limitParam = Number(req.query.limit)
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), MAX_FEED_LIMIT)
      : undefined

  try {
    const {items} = await api('get-profile-feed', {country: country || undefined, limit})

    const query = new URLSearchParams()
    if (country) query.set('country', country)
    const suffix = query.toString() ? `?${query.toString()}` : ''

    const xml = renderRssFeed({
      title: country ? `New Compass profiles — ${country}` : 'New Compass profiles',
      description: country
        ? `People who recently joined Compass in ${country} and chose to be listed publicly.`
        : 'People who recently joined Compass and chose to be listed publicly.',
      feedUrl: `${SITE_URL}/feed.xml${suffix}`,
      siteUrl: SITE_URL,
      linkUrl: `${SITE_URL}/members`,
      items,
      // Attribution for step one of the fediverse plan: point a bridge at a country feed and find out
      // whether anyone actually arrives. PostHog reads utm_* off the landing pageview on its own, and
      // the campaign is per country so a feed that converts is distinguishable from one that does not.
      trackingParams: {
        utm_source: 'feed',
        utm_medium: 'rss',
        utm_campaign: country ? `feed-${country.toLowerCase()}` : 'feed-all',
      },
    })

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    // Long enough that a bridge polling every few minutes never reaches the API, short enough that a
    // member who switches themselves off disappears within the hour.
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600')
    res.status(200).send(xml)
  } catch (e) {
    debug('Failed to build /feed.xml', e)
    console.error('Failed to build /feed.xml', e)
    res.setHeader('Cache-Control', 'no-store')
    res.status(500).send('Could not build the feed right now.')
  }
}
