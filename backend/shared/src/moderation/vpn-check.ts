import {readFileSync, renameSync, statSync, unlinkSync, writeFileSync} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {log} from 'shared/monitoring/log'

import {findRange, IpRange, parseCidr, parseIp} from './ip'
import {VPN_ASNS} from './vpn-asns'

export type VpnNetwork = {asn: number; name: string}
type Entry = {range: IpRange<VpnNetwork>; family: 4 | 6}
type Tables = {v4: IpRange<VpnNetwork>[]; v6: IpRange<VpnNetwork>[]}

/**
 * RIPE NCC's public BGP data: no key, no account, and it is the registry's own view of who announces
 * what — the same data a commercial "is this a VPN" API is ultimately derived from.
 *
 * Fetched at runtime rather than compiled in. The prefixes these networks announce change week to
 * week, so a snapshot in the repo would be tens of thousands of lines that go quietly stale and that
 * nobody can review in a diff.
 */
const RIPESTAT_URL = 'https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS'
const FETCH_TIMEOUT_MS = 20_000
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000

/**
 * How long a signup will wait for the very first load before giving up on it.
 *
 * In practice this never bites: the server kicks the load off at boot, and it is done long before
 * anyone finishes filling in a profile. It exists for the pathological case — the first signup on a
 * cold instance while RIPE is slow — where the right answer is to let the person in.
 */
const FIRST_LOOKUP_MAX_WAIT_MS = 3_000

/**
 * Where the last good answer from RIPEstat is kept, so a machine only ever asks once a day however
 * many times the process starts. Local development restarts on every file save; without this each
 * one would be another dozen requests to a service doing us a favour for free.
 *
 * Deliberately outside the repo — it is a cache, not a source file, and nothing here belongs in git.
 * On Cloud Run this is the instance's own tmpfs, so a fresh instance still fetches once, exactly as
 * it would have without a cache.
 */
const CACHE_FILE = process.env.VPN_RANGES_CACHE_FILE ?? join(tmpdir(), 'compass-vpn-prefixes.txt')
const CACHE_TTL_MS = REFRESH_INTERVAL_MS

let prefixesByAsn: Map<number, Entry[]> | null = null
let tables: Tables | null = null
let inflight: Promise<Tables> | null = null

function buildTables(byAsn: Map<number, Entry[]>): Tables {
  const v4: IpRange<VpnNetwork>[] = []
  const v6: IpRange<VpnNetwork>[] = []
  for (const entries of byAsn.values()) {
    for (const {range, family} of entries) (family === 4 ? v4 : v6).push(range)
  }
  const byStart = (a: IpRange<VpnNetwork>, b: IpRange<VpnNetwork>) =>
    a.start < b.start ? -1 : a.start > b.start ? 1 : 0
  return {v4: v4.sort(byStart), v6: v6.sort(byStart)}
}

/**
 * The ASN list the cache was built from. If `vpn-asns.ts` has changed since — a network added or
 * retired — the cached prefixes are for the wrong question and get thrown away, rather than silently
 * leaving a newly added network unenforced until the file happens to expire.
 */
const cacheHeader = () =>
  `# asns=${Object.keys(VPN_ASNS)
    .map(Number)
    .sort((a, b) => a - b)
    .join(',')}`

function entriesFromPrefixLines(lines: string[]): Map<number, Entry[]> {
  const byAsn = new Map<number, Entry[]>()
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const [asnText, prefix] = line.split(' ')
    const asn = Number(asnText)
    const name = VPN_ASNS[asn]
    if (!name || !prefix) continue
    const parsed = parseCidr(prefix)
    if (!parsed) continue
    const entry: Entry = {
      range: {start: parsed.start, end: parsed.end, payload: {asn, name}},
      family: parsed.family,
    }
    byAsn.set(asn, [...(byAsn.get(asn) ?? []), entry])
  }
  return byAsn
}

/** Null whenever the cache is missing, stale, corrupt, or built from a different ASN list. */
function readCache(): Map<number, Entry[]> | null {
  try {
    if (Date.now() - statSync(CACHE_FILE).mtimeMs > CACHE_TTL_MS) return null
    const lines = readFileSync(CACHE_FILE, 'utf8').split('\n')
    if (lines[0] !== cacheHeader()) {
      log.info('VPN prefix cache was built from a different ASN list; refetching')
      return null
    }
    const byAsn = entriesFromPrefixLines(lines)
    return byAsn.size ? byAsn : null
  } catch {
    return null
  }
}

function writeCache(prefixesByAsn: Map<number, string[]>) {
  const lines = [cacheHeader()]
  for (const [asn, prefixes] of prefixesByAsn) {
    for (const prefix of prefixes) lines.push(`${asn} ${prefix}`)
  }
  // Written aside and renamed so a second process starting at the same moment can never read a
  // half-written file.
  const scratch = `${CACHE_FILE}.${process.pid}.tmp`
  try {
    writeFileSync(scratch, lines.join('\n'))
    renameSync(scratch, CACHE_FILE)
  } catch (e) {
    log.error('Could not write VPN prefix cache', {error: String(e)})
    try {
      unlinkSync(scratch)
    } catch {
      // Nothing to clean up.
    }
  }
}

async function fetchAsnPrefixes(asn: number): Promise<string[]> {
  const res = await fetch(`${RIPESTAT_URL}${asn}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`RIPEstat returned ${res.status} for AS${asn}`)
  const body = (await res.json()) as {data?: {prefixes?: {prefix?: string}[]}}
  const prefixes = (body.data?.prefixes ?? []).map((p) => p.prefix).filter((p): p is string => !!p)
  // An empty answer is a broken answer, never "this network announces nothing" — reading it the
  // other way would silently switch the check off for that network.
  if (!prefixes.length) throw new Error(`RIPEstat returned no prefixes for AS${asn}`)
  return prefixes
}

/**
 * Rebuilds the lookup tables from live BGP data.
 *
 * Degrades per network rather than all-or-nothing: an ASN whose fetch fails keeps whatever prefixes
 * it was already using, so an outage mid-life can never quietly empty the table. On the very first
 * load there is nothing to fall back to, and a failed network simply has no coverage until the next
 * refresh — a missed hold, never a wrong one.
 */
export async function refreshVpnRanges(): Promise<{refreshed: number; failed: number}> {
  const asns = Object.keys(VPN_ASNS).map(Number)
  const previous = prefixesByAsn

  const results = await Promise.all(
    asns.map(async (asn) => {
      try {
        return {asn, prefixes: await fetchAsnPrefixes(asn)}
      } catch (e) {
        log.error(`Could not refresh VPN prefixes for AS${asn}`, {error: String(e)})
        return {asn, prefixes: null}
      }
    }),
  )

  const next = new Map<number, Entry[]>()
  const fetched = new Map<number, string[]>()
  let refreshed = 0
  let failed = 0

  for (const {asn, prefixes} of results) {
    const name = VPN_ASNS[asn]
    if (!prefixes) {
      failed++
      next.set(asn, previous?.get(asn) ?? [])
      continue
    }
    refreshed++
    fetched.set(asn, prefixes)
    const entries: Entry[] = []
    for (const prefix of prefixes) {
      const parsed = parseCidr(prefix)
      if (!parsed) continue
      entries.push({
        range: {start: parsed.start, end: parsed.end, payload: {asn, name}},
        family: parsed.family,
      })
    }
    next.set(asn, entries)
  }

  prefixesByAsn = next
  tables = buildTables(next)
  // Only a complete answer is worth caching: a partial one would pin the gaps in place for a day.
  if (refreshed === asns.length) writeCache(fetched)
  log.info(
    `VPN prefix tables loaded: ${refreshed}/${asns.length} networks live, ${failed} stale, ` +
      `${tables.v4.length + tables.v6.length} ranges total`,
  )
  return {refreshed, failed}
}

/**
 * One load at a time, shared by every caller that arrives while it is running.
 *
 * Today's answer from disk is preferred over asking RIPEstat again — the prefixes move slowly, and
 * this is what keeps a day of local restarts down to a single request.
 */
function ensureTables(): Promise<Tables> {
  if (tables) return Promise.resolve(tables)

  const cached = readCache()
  if (cached) {
    prefixesByAsn = cached
    tables = buildTables(cached)
    log.info(
      `VPN prefix tables loaded from ${CACHE_FILE}: ` +
        `${tables.v4.length + tables.v6.length} ranges across ${cached.size} networks`,
    )
    return Promise.resolve(tables)
  }

  if (!inflight) {
    inflight = refreshVpnRanges()
      .then(() => tables as Tables)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/**
 * Starts the background load: once now, then daily.
 *
 * Called at boot and deliberately not awaited — the server is already serving, and a signup that
 * lands before the first load completes waits a moment for it rather than being checked against
 * nothing. A timer inside a long-lived process needs no cron and cannot outlive the revision that
 * scheduled it.
 */
export function startVpnRangeRefresh() {
  ensureTables().catch((e) => log.error('Initial VPN prefix load failed', {error: String(e)}))
  const timer = setInterval(() => {
    refreshVpnRanges().catch((e) =>
      log.error('Scheduled VPN prefix refresh failed', {error: String(e)}),
    )
  }, REFRESH_INTERVAL_MS)
  // Don't hold the process open on this alone.
  timer.unref?.()
  return timer
}

/**
 * The network an address belongs to, if it is one of the VPN networks in `vpn-asns.ts`.
 *
 * Returns null for every ordinary consumer ISP, for generic cloud, for iCloud Private Relay, for
 * anything unparseable, and for the case where the prefix tables aren't loaded yet — the caller is
 * deciding whether to put a real person's account on hold, so every flavour of "we couldn't tell"
 * has to read the same as "fine".
 */
export async function lookupVpnNetwork(
  ip: string | undefined | null,
  maxWaitMs = FIRST_LOOKUP_MAX_WAIT_MS,
): Promise<VpnNetwork | null> {
  if (!ip) return null
  const parsed = parseIp(ip)
  if (!parsed) return null

  const loaded =
    tables ??
    (await Promise.race([
      ensureTables().catch(() => null),
      // Leaves the load running for whoever asks next rather than cancelling it.
      new Promise<null>((resolve) => setTimeout(() => resolve(null), maxWaitMs).unref?.()),
    ]))
  if (!loaded) {
    log.info('VPN prefix tables not ready; letting this signup through unchecked')
    return null
  }

  return findRange(parsed.family === 4 ? loaded.v4 : loaded.v6, parsed.value)?.payload ?? null
}
