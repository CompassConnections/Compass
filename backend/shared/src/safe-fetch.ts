import {lookup} from 'dns/promises'
import {isIP} from 'net'

// Anywhere we fetch a URL somebody handed us — an imported profile page, an image inside it — the
// request leaves from inside our own network, with whatever reachability that implies. A URL that
// looks like an ordinary web page can point (directly, or via a redirect, or via a hostname whose
// DNS record says so) at `169.254.169.254`, at a database bound to a private subnet, or at a
// response that never ends. These helpers are the one place that is checked, so every fetch-a-URL
// feature gets the same treatment rather than each one remembering on its own.

export const SAFE_FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 3

/** A URL we refuse to request at all: not http(s), unresolvable, or resolving inside our network. */
export class BlockedUrlError extends Error {
  constructor(readonly url: string) {
    super(`Refusing to fetch a non-public address: ${url}`)
    this.name = 'BlockedUrlError'
  }
}

/** A response whose body is past the ceiling the caller allowed. */
export class ResponseTooLargeError extends Error {
  constructor(
    readonly url: string,
    readonly maxBytes: number,
  ) {
    super(`Response from ${url} is larger than ${maxBytes} bytes`)
    this.name = 'ResponseTooLargeError'
  }
}

/**
 * `fetch`, with every hop checked against {@link isPubliclyRoutable} and a timeout that applies to
 * each one. Redirects are followed by hand rather than by the runtime because a public URL that
 * 302s to `169.254.169.254` is the standard way to turn a fetch-this-URL feature into a
 * read-our-metadata-service one, and `redirect: 'follow'` would take that hop without asking.
 *
 * Throws {@link BlockedUrlError} for an address we will not request. Anything the network itself
 * raises (timeout, DNS failure, connection refused) comes through as it would from `fetch`.
 *
 * The check resolves the hostname and then lets `fetch` resolve it again, so a record that changes
 * between the two — DNS rebinding — is not covered. Closing that needs the connection itself
 * pinned to the address we validated, which Node's `fetch` gives no way to do.
 */
export async function safeFetch(
  url: string,
  opts: {headers?: Record<string, string>; timeoutMs?: number; maxRedirects?: number} = {},
): Promise<Response> {
  const {headers, timeoutMs = SAFE_FETCH_TIMEOUT_MS, maxRedirects = MAX_REDIRECTS} = opts

  let next = url
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!(await isPubliclyRoutable(next))) throw new BlockedUrlError(next)

    const response = await fetch(next, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers,
    })

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      next = new URL(location, next).href
      continue
    }
    return response
  }

  throw new Error(`Too many redirects fetching ${url}`)
}

/**
 * Reads at most `maxBytes` of a response body, giving up as soon as the stream goes past it rather
 * than buffering whatever the far end feels like sending. `content-length` is checked first when
 * present, but it is a claim, not a guarantee — the running total is what actually holds the line.
 */
export async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length'))
  if (declared > maxBytes) throw new ResponseTooLargeError(response.url, maxBytes)

  const body = response.body
  if (!body) return Buffer.alloc(0)

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    total += chunk.byteLength
    if (total > maxBytes) {
      // Hang up rather than let the far end keep sending. Best-effort: a body that cannot be
      // cancelled is still one we stop reading here.
      try {
        await body.cancel?.()
      } catch {
        // ignore
      }
      throw new ResponseTooLargeError(response.url, maxBytes)
    }
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

/** {@link readBodyWithLimit}, decoded as UTF-8 — which is what `Response.text()` does too. */
export async function readTextWithLimit(response: Response, maxBytes: number): Promise<string> {
  return (await readBodyWithLimit(response, maxBytes)).toString('utf8')
}

/** True for an http(s) URL whose host resolves to an address outside our own network. */
export async function isPubliclyRoutable(url: string): Promise<boolean> {
  let hostname: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    hostname = parsed.hostname.replace(/^\[|]$/g, '')
  } catch {
    return false
  }

  if (isIP(hostname)) return !isPrivateAddress(hostname)

  try {
    const addresses = await lookup(hostname, {all: true})
    return addresses.length > 0 && addresses.every(({address}) => !isPrivateAddress(address))
  } catch {
    return false
  }
}

function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase()

  if (isIP(ip) === 6) {
    // IPv4-mapped (::ffff:10.0.0.1) is still IPv4 as far as the kernel is concerned.
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return (
      ip === '::' ||
      ip === '::1' ||
      ip.startsWith('fc') || // unique local
      ip.startsWith('fd') ||
      ip.startsWith('fe8') || // link-local
      ip.startsWith('fe9') ||
      ip.startsWith('fea') ||
      ip.startsWith('feb')
    )
  }

  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. the cloud metadata endpoint
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast and reserved
  )
}
