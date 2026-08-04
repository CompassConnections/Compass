// Export every member's social links from the prod DB, grouped by platform.
// Run with:
//   export ENVIRONMENT=PROD && npx tsx backend/scripts/export_social_links.ts
//
// Options (env vars):
//   OUT=../../martin/social-links.json   where to write (default: martin/social-links.json)
//   WITH_USERS=1                         emit {url, username, name} objects instead of bare urls
//
// Output shape (default):
//   {"instagram": ["https://instagram.com/foo", ...], "x": [...], ...}

import {writeFileSync} from 'fs'
import path from 'path'

import {debug} from 'common/logger'
import {getSocialEntries, getSocialUrl, SITE_ORDER, type Site} from 'common/socials'

import {runScript} from './run-script'

const OUT = process.env.OUT ?? path.join(__dirname, '../../martin/social-links.json')
const WITH_USERS = !!process.env.WITH_USERS

type Row = {username: string; name: string; links: Record<string, unknown> | null}

/** Platform order: known sites first (SITE_ORDER), then anything else alphabetically. */
const platformRank = (platform: string) => {
  const i = (SITE_ORDER as readonly string[]).indexOf(platform)
  return i === -1 ? SITE_ORDER.length : i
}

runScript(async ({pg}) => {
  const rows = await pg.manyOrNone<Row>(`
    select u.username, u.name, p.links
    from profiles p
           join users u on u.id = p.user_id
    where p.links is not null
      and p.links::text <> '{}'
    order by u.username
  `)

  debug(`Found ${rows.length} profiles with links`)

  const byPlatform: Record<string, any[]> = {}
  const seen: Record<string, Set<string>> = {}
  let total = 0

  for (const {username, name, links} of rows) {
    for (const {platform, value} of getSocialEntries(links as any)) {
      const raw = typeof value === 'string' ? value.trim() : ''
      if (!raw) continue

      // getSocialUrl only knows the canonical sites; anything custom is kept verbatim.
      const url = (SITE_ORDER as readonly string[]).includes(platform)
        ? getSocialUrl(platform as Site, raw)
        : raw

      byPlatform[platform] ??= []
      seen[platform] ??= new Set()

      const key = `${username}|${url}`
      if (seen[platform].has(key)) continue
      seen[platform].add(key)

      byPlatform[platform].push(WITH_USERS ? {url, username, name} : url)
      total++
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(byPlatform).sort(
      ([a], [b]) => platformRank(a) - platformRank(b) || a.localeCompare(b),
    ),
  )

  writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n')

  for (const [platform, values] of Object.entries(sorted)) {
    debug(`${platform.padEnd(16)} ${values.length}`)
  }
  debug(`Wrote ${total} links across ${Object.keys(sorted).length} platforms to ${OUT}`)
})
