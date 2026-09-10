/**
 * Parsing IPv4/IPv6 text into a comparable number, so an address can be tested for membership in a
 * range. Both families are normalised to a bigint; the two families are kept in separate tables and
 * never compared against each other, since the same integer means different things in each.
 */

export type ParsedIp = {family: 4 | 6; value: bigint}

export function parseV4(s: string): bigint | null {
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

/** Returns null for anything that isn't a well-formed address, including empty input. */
export function parseIp(raw: string): ParsedIp | null {
  const s = raw.trim().replace(/%.*$/, '') // drop any zone id (fe80::1%eth0)
  if (!s) return null
  if (!s.includes(':')) {
    const v4 = parseV4(s)
    return v4 === null ? null : {family: 4, value: v4}
  }

  // An IPv6 address may end in dotted-quad form (::ffff:1.2.3.4, 64:ff9b::1.2.3.4). Rewrite that
  // tail as two hex groups first so the rest of the parse is uniform.
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
  // Without a "::" the address has to be spelled out in full.
  if (halves.length === 1 && total !== 8) return null
  const groups = [...left, ...new Array(8 - total).fill('0'), ...right]

  let value = 0n
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null
    value = (value << 16n) | BigInt(parseInt(group, 16))
  }
  return {family: 6, value}
}

export type IpRange<T> = {start: bigint; end: bigint; payload: T}

/** Ranges must be sorted by `start` and non-overlapping. */
export function findRange<T>(ranges: IpRange<T>[], value: bigint): IpRange<T> | null {
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

/** "1.2.3.0/24" or "2a0d:5600:235::/48" into an inclusive range. Null if it isn't a valid prefix. */
export function parseCidr(cidr: string): {family: 4 | 6; start: bigint; end: bigint} | null {
  const slash = cidr.indexOf('/')
  if (slash < 0) return null
  const parsed = parseIp(cidr.slice(0, slash))
  if (!parsed) return null
  const width = parsed.family === 4 ? 32 : 128
  const bits = Number(cidr.slice(slash + 1))
  if (!Number.isInteger(bits) || bits < 0 || bits > width) return null
  const hostBits = BigInt(width - bits)
  const start = (parsed.value >> hostBits) << hostBits
  return {family: parsed.family, start, end: start + (1n << hostBits) - 1n}
}
