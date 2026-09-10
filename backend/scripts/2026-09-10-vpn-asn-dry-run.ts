import chalk from 'chalk'
import {createWriteStream, existsSync, statSync} from 'fs'
import {createInterface} from 'readline'
import {createReadStream} from 'fs'
import {createGunzip} from 'zlib'
import {pipeline} from 'stream/promises'
import {Readable} from 'stream'
import {tmpdir} from 'os'
import {join} from 'path'
import {VPN_ASNS} from '../shared/src/moderation/vpn-asns'
import {runScript} from './run-script'

// READ-ONLY dry run. Answers one question before we ship any VPN check:
//   "If we had auto-flagged signups on hosting/VPN ASNs, how many of our real members
//    would we have hit?"
//
// Nothing is written to the DB and no account is touched. Output is a report.
//
// Method mirrors what we'd actually deploy (offline ASN lookup, no per-signup API call):
//   1. iptoasn.com's free combined table maps every routed IP range -> ASN + org name.
//   2. Apple publishes its iCloud Private Relay egress ranges; those are datacenter IPs
//      belonging to ordinary iPhone users on Safari, and are the single biggest source of
//      false positives. They get their own bucket rather than being counted as VPN.
//   3. Each member's `initialIpAddress` (private_users.data) is resolved and bucketed.
//
// Note: uses console.log rather than debug() because the report *is* the deliverable —
// debug() is suppressed whenever IS_PROD/IS_DEPLOYED is set, which would silently print
// nothing when run against prod. Same choice as 2026-03-10-delete-users-without-profile.ts.

const IP2ASN_URL = 'https://iptoasn.com/data/ip2asn-combined.tsv.gz'
const APPLE_RELAY_URL = 'https://mask-api.icloud.com/egress-ip-ranges.csv'
const CACHE_FILE = join(tmpdir(), 'compass-ip2asn-combined.tsv')
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type Verdict = 'vpn' | 'hosting' | 'relay' | 'isp' | 'unknown'

// ---------------------------------------------------------------------------
// IP parsing. Both families are normalised to a bigint so ranges can be compared.
// v4 and v6 are kept in separate tables and never compared against each other.
// ---------------------------------------------------------------------------

function parseV4(s: string): bigint | null {
  const parts = s.split('.')
  if (parts.length !== 4) return null
  let value = 0n
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const n = Number(part)
    if (n > 255) return null
    value = (value << 8n) | BigInt(n)
  }
  return value
}

function parseIp(raw: string): {family: 4 | 6; value: bigint} | null {
  const s = raw.trim().replace(/%.*$/, '')
  if (!s) return null
  if (!s.includes(':')) {
    const v4 = parseV4(s)
    return v4 === null ? null : {family: 4, value: v4}
  }

  // An IPv6 address may end in dotted-quad form (::ffff:1.2.3.4). Rewrite that tail as two
  // hex groups so the rest of the parse is uniform.
  let text = s
  const lastColon = text.lastIndexOf(':')
  const tail = text.slice(lastColon + 1)
  if (tail.includes('.')) {
    const v4 = parseV4(tail)
    if (v4 === null) return null
    const hi = (v4 >> 16n) & 0xffffn
    const lo = v4 & 0xffffn
    text = text.slice(0, lastColon + 1) + hi.toString(16) + ':' + lo.toString(16)
  }

  const halves = text.split('::')
  if (halves.length > 2) return null
  const toGroups = (part: string) => (part === '' ? [] : part.split(':'))
  const left = toGroups(halves[0])
  const right = halves.length === 2 ? toGroups(halves[1]) : []
  const total = left.length + right.length
  if (total > 8) return null
  // Without a "::" the address must be fully spelled out.
  if (halves.length === 1 && total !== 8) return null
  const groups = [...left, ...new Array(8 - total).fill('0'), ...right]

  let value = 0n
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null
    value = (value << 16n) | BigInt(parseInt(group, 16))
  }
  return {family: 6, value}
}

function parseCidr(cidr: string): {family: 4 | 6; start: bigint; end: bigint} | null {
  const [addr, bitsText] = cidr.split('/')
  const parsed = parseIp(addr)
  if (!parsed || bitsText === undefined) return null
  const width = parsed.family === 4 ? 32 : 128
  const bits = Number(bitsText)
  if (!Number.isInteger(bits) || bits < 0 || bits > width) return null
  const hostBits = BigInt(width - bits)
  const start = (parsed.value >> hostBits) << hostBits
  const end = start + (1n << hostBits) - 1n
  return {family: parsed.family, start, end}
}

// ---------------------------------------------------------------------------
// Range tables + binary search
// ---------------------------------------------------------------------------

type Range = {start: bigint; end: bigint; asn: number; org: string}

function lookup(ranges: Range[], value: bigint): Range | null {
  let lo = 0
  let hi = ranges.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const range = ranges[mid]
    if (value < range.start) hi = mid - 1
    else if (value > range.end) lo = mid + 1
    else return range
  }
  return null
}

async function loadIp2Asn(): Promise<{v4: Range[]; v6: Range[]}> {
  const fresh =
    existsSync(CACHE_FILE) && Date.now() - statSync(CACHE_FILE).mtimeMs < CACHE_MAX_AGE_MS
  if (!fresh) {
    console.log(chalk.blue(`Downloading ${IP2ASN_URL} …`))
    const res = await fetch(IP2ASN_URL)
    if (!res.ok || !res.body) throw new Error(`ip2asn download failed: ${res.status}`)
    await pipeline(Readable.fromWeb(res.body as any), createGunzip(), createWriteStream(CACHE_FILE))
    console.log(chalk.green(`  cached at ${CACHE_FILE}`))
  } else {
    console.log(chalk.gray(`Using cached ASN table at ${CACHE_FILE}`))
  }

  const v4: Range[] = []
  const v6: Range[] = []
  const reader = createInterface({input: createReadStream(CACHE_FILE), crlfDelay: Infinity})
  for await (const line of reader) {
    // range_start \t range_end \t AS_number \t country_code \t AS_description
    const cols = line.split('\t')
    if (cols.length < 5) continue
    const asn = Number(cols[2])
    if (!asn) continue // 0 = range is not announced by anyone
    const start = parseIp(cols[0])
    const end = parseIp(cols[1])
    if (!start || !end || start.family !== end.family) continue
    const range: Range = {start: start.value, end: end.value, asn, org: cols[4]}
    ;(start.family === 4 ? v4 : v6).push(range)
  }
  v4.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  v6.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
  console.log(chalk.gray(`  ${v4.length} IPv4 ranges, ${v6.length} IPv6 ranges`))
  return {v4, v6}
}

async function loadAppleRelayRanges() {
  const out: {family: 4 | 6; start: bigint; end: bigint}[] = []
  try {
    const res = await fetch(APPLE_RELAY_URL)
    if (!res.ok) throw new Error(`status ${res.status}`)
    for (const line of (await res.text()).split('\n')) {
      const prefix = line.split(',')[0]?.trim()
      if (!prefix) continue
      const range = parseCidr(prefix)
      if (range) out.push(range)
    }
    console.log(chalk.gray(`  ${out.length} iCloud Private Relay egress ranges`))
  } catch (err) {
    console.warn(chalk.yellow(`  could not fetch Private Relay ranges (${err}) — continuing`))
  }
  return out
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

// The same list production holds accounts on, so re-running this script previews exactly what the
// live rule would do rather than approximating it. Edit backend/shared/src/moderation/vpn-asns.ts.
const KNOWN_VPN_ASNS = new Set(Object.keys(VPN_ASNS).map(Number))

// Matches the org name, so it is driven by real data rather than a hardcoded ASN list.
const VPN_PATTERNS = /\b(vpn|proxy|anonym|tor[\s-]?exit|privacy)\b/i
const HOSTING_PATTERNS =
  /\b(host\w*|cloud|server|serveur|data[\s-]?cent(er|re)|colo|colocation|vps|dedicated|digitalocean|ovh|hetzner|linode|vultr|contabo|leaseweb|choopa|scaleway|amazon|google llc|microsoft|oracle|alibaba|akamai|cloudflare|fastly|m247|datacamp|packethub|cdn77|cdnext|tzulo|i3d)\b/i

function classify(org: string, asn: number): Verdict {
  if (KNOWN_VPN_ASNS.has(asn) || VPN_PATTERNS.test(org)) return 'vpn'
  if (HOSTING_PATTERNS.test(org)) return 'hosting'
  return 'isp'
}

// ---------------------------------------------------------------------------

type Row = {
  id: string
  username: string
  created_time: Date
  is_banned_from_posting: boolean | null
  ban_reason: string | null
  ip: string | null
  messages: string
  likes_given: string
  reports_against: string
  last_online: Date | null
}

// TIMESTAMPTZ arrives as a Date. Tolerate a string too, in case a caller hands us raw JSON.
const day = (d: Date | string) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10)

runScript(async ({pg}) => {
  const {v4, v6} = await loadIp2Asn()
  const relayRanges = await loadAppleRelayRanges()

  const rows = await pg.manyOrNone<Row>(`
    select u.id,
           u.username,
           u.created_time,
           u.is_banned_from_posting,
           u.ban_reason,
           pu.data->>'initialIpAddress' as ip,
           (select count(*) from private_user_messages m where m.user_id = u.id) as messages,
           (select count(*) from profile_likes l where l.creator_id = u.id) as likes_given,
           (select count(*) from reports r where r.content_owner_id = u.id) as reports_against,
           (select max(a.last_online_time) from user_activity a where a.user_id = u.id) as last_online
      from users u
      join private_users pu on pu.id = u.id
     order by u.created_time
  `)

  const withIp = rows.filter((r) => r.ip)
  console.log(
    chalk.cyan(
      `\n${rows.length} members, ${withIp.length} with a recorded signup IP ` +
        `(${rows.length - withIp.length} without — signed up before we stored it, or missing).`,
    ),
  )

  const isRelay = (family: 4 | 6, value: bigint) =>
    relayRanges.some((r) => r.family === family && value >= r.start && value <= r.end)

  type Assessment = {row: Row; verdict: Verdict; asn: number | null; org: string}
  const assessed: Assessment[] = []

  for (const row of withIp) {
    const parsed = parseIp(row.ip as string)
    if (!parsed) {
      assessed.push({row, verdict: 'unknown', asn: null, org: '(unparseable)'})
      continue
    }
    if (isRelay(parsed.family, parsed.value)) {
      assessed.push({row, verdict: 'relay', asn: null, org: 'iCloud Private Relay'})
      continue
    }
    const match = lookup(parsed.family === 4 ? v4 : v6, parsed.value)
    if (!match) {
      assessed.push({row, verdict: 'unknown', asn: null, org: '(not in ASN table)'})
      continue
    }
    assessed.push({
      row,
      verdict: classify(match.org, match.asn),
      asn: match.asn,
      org: match.org,
    })
  }

  // A member we'd be embarrassed to have auto-flagged: not banned, never reported, and
  // they actually did something after signing up.
  const isEstablished = (r: Row) =>
    !r.is_banned_from_posting &&
    Number(r.reports_against) === 0 &&
    (Number(r.messages) > 0 ||
      Number(r.likes_given) > 0 ||
      (r.last_online !== null &&
        r.last_online.getTime() - r.created_time.getTime() > 7 * 24 * 60 * 60 * 1000))

  const bucket = (v: Verdict) => assessed.filter((a) => a.verdict === v)

  console.log(chalk.cyan('\n── Verdict breakdown ───────────────────────────────'))
  const verdicts: Verdict[] = ['vpn', 'hosting', 'relay', 'isp', 'unknown']
  for (const verdict of verdicts) {
    const group = bucket(verdict)
    if (!group.length) continue
    const banned = group.filter((a) => a.row.is_banned_from_posting).length
    const reported = group.filter((a) => Number(a.row.reports_against) > 0).length
    const established = group.filter((a) => isEstablished(a.row)).length
    const pct = ((group.length / withIp.length) * 100).toFixed(1)
    const color =
      verdict === 'vpn'
        ? chalk.red
        : verdict === 'hosting' || verdict === 'relay'
          ? chalk.yellow
          : chalk.gray
    console.log(
      color(
        `  ${verdict.padEnd(8)} ${String(group.length).padStart(5)} (${pct.padStart(5)}%)` +
          `   banned: ${banned}   reported: ${reported}   established-and-clean: ${established}`,
      ),
    )
  }

  console.log(chalk.cyan('\n── If we auto-held on this signal ──────────────────'))
  for (const [label, flagged] of [
    ['VPN ASNs only (narrow)', bucket('vpn')],
    ['VPN + hosting (broad)', [...bucket('vpn'), ...bucket('hosting')]],
    ['VPN + hosting + relay (naive)', [...bucket('vpn'), ...bucket('hosting'), ...bucket('relay')]],
  ] as const) {
    const caught = flagged.filter((a) => a.row.is_banned_from_posting).length
    const falsePositives = flagged.filter((a) => isEstablished(a.row)).length
    const allBanned = assessed.filter((a) => a.row.is_banned_from_posting).length
    const recall = allBanned ? ((caught / allBanned) * 100).toFixed(0) : 'n/a'
    console.log(
      `  ${label.padEnd(30)} holds ${String(flagged.length).padStart(4)} members` +
        `  |  ${caught}/${allBanned} known-bad caught (${recall}%)` +
        `  |  ${chalk.red(String(falsePositives))} established members wrongly held`,
    )
  }

  console.log(chalk.cyan('\n── ASNs by member count (eyeball these) ────────────'))
  const byAsn = new Map<string, {count: number; verdict: Verdict; banned: number}>()
  for (const a of assessed) {
    const key = a.asn ? `AS${a.asn} ${a.org}` : a.org
    const entry = byAsn.get(key) ?? {count: 0, verdict: a.verdict, banned: 0}
    entry.count++
    if (a.row.is_banned_from_posting) entry.banned++
    byAsn.set(key, entry)
  }
  const sorted = [...byAsn.entries()].sort((x, y) => y[1].count - x[1].count)
  for (const [name, info] of sorted.slice(0, 40)) {
    const tag =
      info.verdict === 'vpn'
        ? chalk.red('[VPN]    ')
        : info.verdict === 'hosting'
          ? chalk.yellow('[HOSTING]')
          : info.verdict === 'relay'
            ? chalk.yellow('[RELAY]  ')
            : chalk.gray('[isp]    ')
    console.log(
      `  ${tag} ${String(info.count).padStart(4)} members` +
        `${info.banned ? chalk.red(` (${info.banned} banned)`) : ''}  ${name.slice(0, 70)}`,
    )
  }
  if (sorted.length > 40) console.log(chalk.gray(`  … and ${sorted.length - 40} more ASNs`))

  // Keyword matching on org names is guesswork and it missed CDNEXT/CDN77 on the first run.
  // This ranks ASNs by the share of their members we've already banned, which finds hostile
  // infrastructure from your own moderation history instead of from a list someone else wrote.
  console.log(chalk.cyan('\n── ASNs by banned share (data-driven, no keywords) ──'))
  const suspicious = [...byAsn.entries()]
    .filter(([, info]) => info.banned > 0)
    .sort((x, y) => y[1].banned / y[1].count - x[1].banned / x[1].count)
  const baseRate = assessed.filter((a) => a.row.is_banned_from_posting).length / assessed.length
  console.log(chalk.gray(`  baseline: ${(baseRate * 100).toFixed(1)}% of all members are banned`))
  for (const [name, info] of suspicious) {
    const share = info.banned / info.count
    const lift = share / baseRate
    const color = lift >= 5 ? chalk.red : lift >= 2 ? chalk.yellow : chalk.gray
    console.log(
      color(
        `  ${(share * 100).toFixed(0).padStart(3)}% banned (${info.banned}/${info.count})` +
          `  ${lift.toFixed(1)}x baseline  ${name.slice(0, 60)}`,
      ),
    )
  }

  // Every member on a VPN/hosting ASN, by name, grouped by network. This is the list to
  // actually read: for each one, decide whether "signed up behind a VPN" looks like a scammer
  // or like a privacy-conscious member, and let that decide whether the rule ships as a hold.
  console.log(chalk.cyan('\n── Members on VPN / hosting ASNs, by network ────────'))
  const flaggedMembers = [...bucket('vpn'), ...bucket('hosting'), ...bucket('relay')]
  const byNetwork = new Map<string, Assessment[]>()
  for (const a of flaggedMembers) {
    const key = `${a.verdict}|${a.asn ? `AS${a.asn} ${a.org}` : a.org}`
    byNetwork.set(key, [...(byNetwork.get(key) ?? []), a])
  }
  const networks = [...byNetwork.entries()].sort((x, y) => {
    const rank = (v: string) => (v.startsWith('vpn') ? 0 : v.startsWith('hosting') ? 1 : 2)
    return rank(x[0]) - rank(y[0]) || y[1].length - x[1].length
  })
  for (const [key, members] of networks) {
    const [verdict, network] = key.split('|')
    const color = verdict === 'vpn' ? chalk.red : chalk.yellow
    console.log(
      color(`\n  ${verdict.toUpperCase()}  ${network}`) +
        chalk.gray(`  — ${members.length} member${members.length === 1 ? '' : 's'}`),
    )
    for (const a of members.sort(
      (x, y) => x.row.created_time.getTime() - y.row.created_time.getTime(),
    )) {
      const status = a.row.is_banned_from_posting
        ? chalk.red('BANNED  ')
        : Number(a.row.reports_against) > 0
          ? chalk.yellow('reported')
          : isEstablished(a.row)
            ? chalk.green('active  ')
            : chalk.gray('dormant ')
      console.log(
        `    ${status} ${chalk.bold(a.row.username.padEnd(24))} joined ${day(a.row.created_time)}` +
          `  msgs:${String(a.row.messages).padStart(4)}` +
          `  likes:${String(a.row.likes_given).padStart(4)}` +
          `  ${chalk.gray(a.row.ip ?? '')}`,
      )
    }
  }

  const wouldHurt = [...bucket('vpn'), ...bucket('hosting'), ...bucket('relay')].filter((a) =>
    isEstablished(a.row),
  )
  if (wouldHurt.length) {
    console.log(
      chalk.cyan('\n── Established members a broad rule would have held ─'),
      chalk.gray('(these are your false positives — are they really scammers?)'),
    )
    for (const a of wouldHurt.slice(0, 60)) {
      console.log(
        `  ${chalk.bold(a.row.username.padEnd(22))} joined ${day(a.row.created_time)}` +
          `  msgs:${String(a.row.messages).padStart(4)}  likes:${String(a.row.likes_given).padStart(4)}` +
          `  ${chalk.gray(a.org.slice(0, 45))}`,
      )
    }
    if (wouldHurt.length > 60) console.log(chalk.gray(`  … and ${wouldHurt.length - 60} more`))
  }

  console.log(chalk.cyan('\n── Known-bad accounts and where they signed up from ─'))
  for (const a of assessed.filter((x) => x.row.is_banned_from_posting)) {
    const tag = a.verdict === 'isp' ? chalk.gray('[missed]') : chalk.green('[caught]')
    console.log(
      `  ${tag} ${a.row.username.padEnd(22)} ${(a.row.ban_reason ?? '—').padEnd(16)} ${chalk.gray(a.org.slice(0, 50))}`,
    )
  }

  console.log(chalk.cyan('\n────────────────────────────────────────────────────'))
  console.log(chalk.gray('Read-only: nothing was written and no account was changed.\n'))
})
