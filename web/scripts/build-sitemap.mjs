/**
 * Writes public/sitemap.xml at build time.
 *
 * Generated rather than committed so a route that gets renamed or deleted cannot leave a 404 sitting
 * in the sitemap for months — the build fails instead (see the existence check below). Same shape as
 * `fetch-media.mjs`: a build step that produces something into `public/`, gitignored, so Vercel
 * serves it from the CDN as a static file with no runtime cost.
 *
 * **The route list is deliberately explicit.** Walking `pages/` and excluding what looks private
 * would put `/settings`, `/notifications` and `/messages` one forgotten exclusion away from being
 * advertised to crawlers, and the failure is silent. An allow-list fails the other way: a new public
 * page is merely absent until someone adds it here, which costs nothing but a little discovery time.
 *
 * Member profiles are not listed. They are indexable only when the member chose public visibility
 * (see the `noindex` in `pages/[username]/index.tsx`), so enumerating them here would need a database
 * read that respects that flag — worth doing later as its own sitemap, not worth guessing at now.
 *
 * `lastmod` is omitted on purpose. The honest value would come from git, which is shallow-cloned on
 * Vercel, and a `lastmod` of "whenever this deployed" on every URL is exactly the kind of noise
 * Google learns to ignore. `changefreq` and `priority` are omitted because Google ignores them
 * outright.
 */

import {existsSync} from 'node:fs'
import {writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const WEB_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE_URL = 'https://www.compassmeet.com'

/**
 * Every page we want crawled and indexed, as a route.
 *
 * Add a new public page here when you add one. Anything behind sign-in (`/settings`,
 * `/notifications`, `/messages`, `/onboarding`, `/profile`, `/referrals`), anything transient
 * (`/loading`, `/404`), internal tooling (`/admin`, already `Disallow`ed in robots.txt) and the
 * auth flow itself (`/signin`, `/signup`, `/register`) are all deliberately absent — a sitemap is a
 * statement that a URL is worth indexing, not an inventory of what exists.
 */
const ROUTES = [
  '/',
  '/about',
  '/members',
  '/events',
  '/compatibility',
  '/testimonials',
  '/blog',
  '/stats',
  '/news',
  '/press',
  '/financials',
  '/constitution',
  '/organization',
  '/donate',
  '/social',
  '/faq',
  '/help',
  '/support',
  '/contact',
  '/tips-bio',
  '/security',
  '/privacy',
  '/terms',
]

/** `/about` → `pages/about.tsx`, `/` → `pages/index.tsx`. */
function pageFileFor(route) {
  const base = route === '/' ? 'index' : route.slice(1)
  return ['tsx', 'ts', 'jsx', 'js']
    .flatMap((ext) => [
      join(WEB_DIR, 'pages', `${base}.${ext}`),
      // `/blog` is `pages/blog/index.tsx`. Individual posts are not listed: enumerating them needs a
      // database read for the published set, which is worth doing as its own sitemap rather than
      // guessing at here — same call as member profiles above.
      join(WEB_DIR, 'pages', base, `index.${ext}`),
    ])
    .find(existsSync)
}

const missing = ROUTES.filter((route) => !pageFileFor(route))
if (missing.length) {
  // Loud on purpose. A sitemap advertising URLs that 404 is worse than no sitemap: it spends crawl
  // budget on nothing and is the kind of thing Search Console reports weeks later.
  console.error(`build-sitemap: no page file for ${missing.join(', ')}`)
  process.exit(1)
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...ROUTES.map((route) => `  <url><loc>${BASE_URL}${route === '/' ? '/' : route}</loc></url>`),
  '</urlset>',
  '',
].join('\n')

const out = join(WEB_DIR, 'public', 'sitemap.xml')
await writeFile(out, xml, 'utf-8')
console.log(`build-sitemap: wrote ${ROUTES.length} urls to public/sitemap.xml`)
