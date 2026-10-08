import {readFileSync, renameSync, statSync, unlinkSync, writeFileSync} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {log} from 'shared/monitoring/log'

import {findRange, IpRange, parseCidr, parseIp} from './ip'
import {VPN_ASNS} from './vpn-asns'

export type VpnNetwork = {asn: number; name: string}
type Entry = {range: IpRange<VpnNetwork>; family: 4 | 6; prefix: string}
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
 * How soon a network whose fetch failed is tried again, doubling each time up to the cap. A day was
 * the original answer, and it is wrong for where this runs: a Cloud Run instance seldom lives a
 * day, so a network that missed its first load stayed unenforced for the instance's whole life.
 */
const RETRY_BASE_MS = 60_000
const RETRY_MAX_MS = 30 * 60 * 1000

/**
 * How long a lookup will wait, by default, for the tables to be complete before answering with
 * whatever it has.
 *
 * The server kicks the load off at boot, and most of the time it is done long before anyone
 * finishes filling in a profile. This exists for the other case — a signup on a cold instance while
 * RIPE is slow — where the right answer is to let the person in. Callers that can afford to wait
 * longer pass their own budget.
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

const allAsns = () => Object.keys(VPN_ASNS).map(Number)

/** Networks the tables currently say nothing about: never loaded, or loaded and found empty. */
export function missingVpnAsns(): number[] {
  return allAsns().filter((asn) => !prefixesByAsn?.get(asn)?.length)
}

/** True once every listed network has prefixes to check against. */
export const isVpnTableComplete = () => !!tables && missingVpnAsns().length === 0

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms).unref?.())

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
      prefix,
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
 * Rebuilds the lookup tables from live BGP data — for every listed network, or only the ones given.
 *
 * Degrades per network rather than all-or-nothing: an ASN whose fetch fails keeps whatever prefixes
 * it was already using, so an outage mid-life can never quietly empty the table. On the very first
 * load there is nothing to fall back to, and a failed network simply has no coverage until it is
 * retried — by `lookupVpnNetwork` the next time someone signs up, and by the backoff timer in
 * `startVpnRangeRefresh` — a missed hold, never a wrong one.
 */
export async function refreshVpnRanges(
  asns: number[] = allAsns(),
): Promise<{refreshed: number; failed: number}> {
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

  // Networks not in this round keep what they had.
  const next = new Map<number, Entry[]>(previous ?? [])
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
        prefix,
      })
    }
    next.set(asn, entries)
  }

  prefixesByAsn = next
  tables = buildTables(next)
  // Only a complete answer is worth caching: a partial one would pin the gaps in place for a day.
  // A partial round that completed the picture is still a complete picture, so the file is rebuilt
  // from everything we now hold rather than from this round alone.
  if (refreshed === asns.length && missingVpnAsns().length === 0) {
    const everything = new Map<number, string[]>()
    for (const [asn, entries] of next) {
      everything.set(
        asn,
        entries.map((entry) => entry.prefix),
      )
    }
    writeCache(everything)
  }
  log.info(
    `VPN prefix tables loaded: ${refreshed}/${asns.length} networks live, ${failed} stale, ` +
      `${tables.v4.length + tables.v6.length} ranges total`,
  )
  return {refreshed, failed}
}

/**
 * Loads the networks the tables still say nothing about. One round at a time: a second caller
 * arriving while one is running joins it rather than doubling the requests to RIPE.
 */
function refreshMissing(): Promise<Tables> {
  if (inflight) return inflight
  const missing = missingVpnAsns()
  if (!missing.length) return Promise.resolve(tables as Tables)
  inflight = refreshVpnRanges(missing)
    .then(() => tables as Tables)
    .finally(() => {
      inflight = null
    })
  return inflight
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
  // A network that failed is tried again soon, backing off, instead of waiting for tomorrow's
  // refresh that this instance will most likely never see. (Cloud Run gives an idle instance almost
  // no CPU, so these timers can run late; the signup path retries on its own, see
  // `lookupVpnNetwork`.)
  let retryDelay = RETRY_BASE_MS
  const retryMissing = () => {
    if (!missingVpnAsns().length) {
      retryDelay = RETRY_BASE_MS
      return
    }
    const timer = setTimeout(() => {
      refreshMissing()
        .catch((e) => log.error('VPN prefix retry failed', {error: String(e)}))
        .finally(retryMissing)
    }, retryDelay)
    timer.unref?.()
    retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS)
  }

  ensureTables()
    .catch((e) => log.error('Initial VPN prefix load failed', {error: String(e)}))
    .finally(retryMissing)
  const timer = setInterval(() => {
    refreshVpnRanges()
      .catch((e) => log.error('Scheduled VPN prefix refresh failed', {error: String(e)}))
      .finally(retryMissing)
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
 * has to read the same as "fine". `isVpnTableComplete()` tells the two apart afterwards.
 *
 * While any listed network is missing from the tables, this keeps loading it until the budget runs
 * out: first by joining the load already running, then with fresh requests of its own. That is what
 * makes the check work on Cloud Run, where the load the server starts at boot only gets CPU while a
 * request is in flight — the request that calls this is that CPU. Whatever is loaded by the
 * deadline is what gets checked: a hit on a network we do have is still a hit.
 */
export async function lookupVpnNetwork(
  ip: string | undefined | null,
  maxWaitMs = FIRST_LOOKUP_MAX_WAIT_MS,
): Promise<VpnNetwork | null> {
  if (!ip) return null
  const parsed = parseIp(ip)
  if (!parsed) return null

  const deadline = Date.now() + maxWaitMs
  let attempts = 0
  while (!isVpnTableComplete()) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    // A round that fails fast (RIPE down, DNS broken) must not turn into a tight loop of requests.
    if (attempts > 0) await sleep(Math.min(1_000 * attempts, remaining))
    attempts++
    // Leaves the load running for whoever asks next rather than cancelling it.
    const load = (tables ? refreshMissing() : ensureTables()).then(
      () => true,
      () => true,
    )
    const finished = await Promise.race([load, sleep(deadline - Date.now()).then(() => false)])
    if (!finished) break
  }

  if (!tables) {
    log.info('VPN prefix tables not ready; letting this signup through unchecked')
    return null
  }
  const missing = missingVpnAsns()
  if (missing.length) {
    log.warn(
      `VPN check ran without ${missing.length} of ${allAsns().length} networks: ` +
        missing.map((asn) => `AS${asn}`).join(', '),
    )
  }
  return findRange(parsed.family === 4 ? tables.v4 : tables.v6, parsed.value)?.payload ?? null
}
