import {readFileSync, unlinkSync, utimesSync, writeFileSync} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'
import {parseIp} from 'shared/moderation/ip'
import {isApplePrivateEmail, VPN_ASNS} from 'shared/moderation/vpn-asns'

describe('parseIp', () => {
  it('parses IPv4', () => {
    expect(parseIp('1.2.3.4')).toEqual({family: 4, value: 16909060n})
    expect(parseIp('0.0.0.0')).toEqual({family: 4, value: 0n})
    expect(parseIp('255.255.255.255')).toEqual({family: 4, value: 4294967295n})
  })

  it('parses IPv6, including "::" in every position', () => {
    expect(parseIp('::')).toEqual({family: 6, value: 0n})
    expect(parseIp('::1')).toEqual({family: 6, value: 1n})
    expect(parseIp('2001:db8::')?.family).toBe(6)
    expect(parseIp('fe80::1%eth0')?.family).toBe(6) // zone id is dropped
  })

  it('treats a compressed address and its expanded form as the same number', () => {
    expect(parseIp('2a0d:5600:235:6000:4b57:88b1:75ed:e785')?.value).toBe(
      parseIp('2a0d:5600:0235:6000:4b57:88b1:75ed:e785')?.value,
    )
  })

  it('parses an embedded IPv4 tail', () => {
    expect(parseIp('::ffff:1.2.3.4')?.value).toBe(0xffff00000000n + 16909060n)
    expect(parseIp('64:ff9b::1.2.3.4')?.family).toBe(6)
  })

  it('rejects malformed input rather than guessing', () => {
    for (const bad of ['', '  ', '1.2.3', '1.2.3.256', 'gggg::1', '1:2:3:4:5:6:7', '1::2::3']) {
      expect(parseIp(bad)).toBeNull()
    }
  })
})

describe('vpn lookup', () => {
  // Real prefixes, from RIPEstat, covering the addresses our confirmed-abuse accounts signed up
  // from. Stated here rather than fetched so the suite is deterministic and offline.
  const M247_PREFIXES = ['2a0d:5600:235::/48', '37.120.236.0/24', '146.70.134.0/24']
  const CDNEXT_PREFIXES = ['85.203.46.0/24']
  const SCAMMER_IPV6 = '2a0d:5600:235:6000:4b57:88b1:75ed:e785' // anitagrey, confirmed_abuse

  // Each case gets its own cache file, so the suite never reads or writes the machine's real one.
  let cacheFile = ''
  beforeEach(() => {
    cacheFile = join(tmpdir(), `compass-vpn-test-${Math.random().toString(36).slice(2)}.txt`)
    process.env.VPN_RANGES_CACHE_FILE = cacheFile
  })
  afterEach(() => {
    delete process.env.VPN_RANGES_CACHE_FILE
    try {
      unlinkSync(cacheFile)
    } catch {
      // Most cases never write one.
    }
  })

  const freshModule = async () => {
    jest.resetModules()
    return import('shared/moderation/vpn-check')
  }

  /** Every listed network answers, which is what it takes for a load to be cached. */
  const mockAllAsnsRespond = () => {
    const asns = Object.keys(VPN_ASNS).map(Number)
    mockRipe(
      Object.fromEntries(
        asns.map((asn, i) => [asn, asn === 9009 ? M247_PREFIXES : [`198.51.${i}.0/24`]]),
      ),
    )
  }

  // Counted here rather than off the jest mock: jest.resetModules(), which every restart in these
  // tests goes through, wipes a mock's call history along with the module registry.
  let fetchCalls = 0
  const fetchCount = () => fetchCalls

  const mockRipe = (byAsn: Record<number, string[] | 'fail' | 'empty' | 'hang'>) => {
    fetchCalls = 0
    global.fetch = jest.fn(async (url: any) => {
      fetchCalls++
      const asn = Number(String(url).split('resource=AS')[1])
      const entry = byAsn[asn]
      if (entry === 'fail') throw new Error('network down')
      if (entry === 'hang') await new Promise(() => {}) // never resolves
      const prefixes = entry === 'empty' || entry === 'hang' || !entry ? [] : entry
      return {
        ok: true,
        json: async () => ({data: {prefixes: prefixes.map((prefix) => ({prefix}))}}),
      } as any
    }) as any
  }

  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  const loaded = async () => {
    mockRipe({9009: M247_PREFIXES, 212238: CDNEXT_PREFIXES})
    const mod = await freshModule()
    await mod.refreshVpnRanges()
    return mod
  }

  it('flags the IPv6 M247 address a confirmed scammer signed up from', async () => {
    const mod = await loaded()
    expect(await mod.lookupVpnNetwork(SCAMMER_IPV6)).toEqual({asn: 9009, name: 'M247'})
  })

  it('flags IPv4 addresses on listed networks', async () => {
    const mod = await loaded()
    expect((await mod.lookupVpnNetwork('37.120.236.26'))?.asn).toBe(9009) // carmenmonique98
    expect((await mod.lookupVpnNetwork('146.70.134.26'))?.asn).toBe(9009) // ajinkyak
    expect((await mod.lookupVpnNetwork('85.203.46.196'))?.asn).toBe(212238) // CharlieSchmitt
  })

  it('leaves everything outside the announced prefixes alone', async () => {
    const mod = await loaded()
    // Consumer ISPs and public resolvers.
    expect(await mod.lookupVpnNetwork('8.8.8.8')).toBeNull()
    expect(await mod.lookupVpnNetwork('2001:4860:4860::8888')).toBeNull()
    // iCloud Private Relay egress addresses of members in good standing.
    expect(await mod.lookupVpnNetwork('104.28.123.93')).toBeNull()
    expect(await mod.lookupVpnNetwork('2a09:bac3:2bb8:32d2::510:c')).toBeNull()
    // Generic cloud — a developer on AWS or DigitalOcean is not a fraud signal.
    expect(await mod.lookupVpnNetwork('52.10.68.136')).toBeNull()
    expect(await mod.lookupVpnNetwork('143.244.161.117')).toBeNull()
    // Adjacent to a listed prefix but outside it.
    expect(await mod.lookupVpnNetwork('37.120.237.26')).toBeNull()
  })

  it('treats an unreadable or missing address as fine, never as a hit', async () => {
    const mod = await loaded()
    expect(await mod.lookupVpnNetwork(undefined)).toBeNull()
    expect(await mod.lookupVpnNetwork(null)).toBeNull()
    expect(await mod.lookupVpnNetwork('')).toBeNull()
    expect(await mod.lookupVpnNetwork('not-an-ip')).toBeNull()
  })

  it('loads on first use without anyone calling refresh', async () => {
    mockRipe({9009: M247_PREFIXES})
    const mod = await freshModule()
    expect((await mod.lookupVpnNetwork(SCAMMER_IPV6))?.asn).toBe(9009)
  })

  it('shares one load between concurrent lookups', async () => {
    mockRipe({9009: M247_PREFIXES})
    const mod = await freshModule()
    await Promise.all([
      mod.lookupVpnNetwork(SCAMMER_IPV6),
      mod.lookupVpnNetwork('37.120.236.26'),
      mod.lookupVpnNetwork('8.8.8.8'),
    ])
    // One request per network, not per lookup.
    expect(fetchCount()).toBe(Object.keys(VPN_ASNS).length)
  })

  it('picks up a newly announced prefix and drops a withdrawn one', async () => {
    const mod = await loaded()
    expect(await mod.lookupVpnNetwork('203.0.113.7')).toBeNull()

    mockRipe({9009: ['203.0.113.0/24']}) // M247 now announces only this
    await mod.refreshVpnRanges()

    expect((await mod.lookupVpnNetwork('203.0.113.7'))?.asn).toBe(9009)
    expect(await mod.lookupVpnNetwork(SCAMMER_IPV6)).toBeNull()
  })

  it('keeps the prefixes it already had for a network whose refresh fails', async () => {
    const mod = await loaded()

    mockRipe({9009: 'fail', 212238: ['203.0.113.0/24']})
    const {refreshed, failed} = await mod.refreshVpnRanges()

    expect(refreshed).toBeGreaterThan(0)
    expect(failed).toBeGreaterThan(0)
    expect((await mod.lookupVpnNetwork(SCAMMER_IPV6))?.asn).toBe(9009)
  })

  it('treats an empty response as a failure rather than as "no prefixes"', async () => {
    const mod = await loaded()
    mockRipe({9009: 'empty'})
    await mod.refreshVpnRanges()
    // Must never be read as "M247 announces nothing, let everyone through".
    expect((await mod.lookupVpnNetwork(SCAMMER_IPV6))?.asn).toBe(9009)
  })

  it('lets the signup through when the very first load cannot complete', async () => {
    mockRipe({9009: 'fail', 212238: 'fail'})
    const mod = await freshModule()
    // Nothing to fall back to on a cold start: a miss, never a wrong hold.
    expect(await mod.lookupVpnNetwork(SCAMMER_IPV6)).toBeNull()
  })

  it('does not make a signup wait on a hung RIPEstat', async () => {
    mockRipe({9009: 'hang', 212238: 'hang'})
    const mod = await freshModule()
    const started = Date.now()
    expect(await mod.lookupVpnNetwork(SCAMMER_IPV6, 50)).toBeNull()
    expect(Date.now() - started).toBeLessThan(1_000)
  })

  it('writes a cache once every network has answered', async () => {
    mockAllAsnsRespond()
    const mod = await freshModule()
    await mod.refreshVpnRanges()

    const written = readFileSync(cacheFile, 'utf8')
    expect(written.split('\n')[0]).toContain('# asns=')
    expect(written).toContain('9009 2a0d:5600:235::/48')
  })

  it('does not touch the network on a restart with a warm cache', async () => {
    mockAllAsnsRespond()
    const first = await freshModule()
    await first.refreshVpnRanges()
    const callsAfterFirstBoot = fetchCount()
    expect(callsAfterFirstBoot).toBeGreaterThan(0)

    // A second process start — nodemon on file save, say — reads the file instead.
    const second = await freshModule()
    expect((await second.lookupVpnNetwork(SCAMMER_IPV6))?.asn).toBe(9009)
    expect(fetchCount()).toBe(callsAfterFirstBoot)
  })

  it('does not cache a partial load, so gaps are never pinned in place for a day', async () => {
    const mod = await loaded() // only two networks answered
    expect(() => readFileSync(cacheFile, 'utf8')).toThrow()
    expect((await mod.lookupVpnNetwork(SCAMMER_IPV6))?.asn).toBe(9009)
  })

  it('ignores a cache written from a different ASN list', async () => {
    writeFileSync(cacheFile, ['# asns=1,2,3', '9009 2a0d:5600:235::/48'].join('\n'))
    mockAllAsnsRespond()
    const mod = await freshModule()
    await mod.lookupVpnNetwork(SCAMMER_IPV6)
    // Adding a network to vpn-asns.ts must not be silently ignored until the cache expires.
    expect(fetchCount()).toBeGreaterThan(0)
  })

  it('ignores a cache older than a day', async () => {
    mockAllAsnsRespond()
    const first = await freshModule()
    await first.refreshVpnRanges()
    const callsAfterFirstBoot = fetchCount()

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    utimesSync(cacheFile, twoDaysAgo, twoDaysAgo)

    const second = await freshModule()
    await second.lookupVpnNetwork(SCAMMER_IPV6)
    expect(fetchCount()).toBeGreaterThan(callsAfterFirstBoot)
  })

  it('falls back to fetching when the cache is corrupt', async () => {
    writeFileSync(cacheFile, 'not a cache file at all')
    mockAllAsnsRespond()
    const mod = await freshModule()
    expect((await mod.lookupVpnNetwork(SCAMMER_IPV6))?.asn).toBe(9009)
    expect(fetchCount()).toBeGreaterThan(0)
  })

  it('names every listed ASN', () => {
    for (const name of Object.values(VPN_ASNS)) expect(name).toBeTruthy()
  })
})

describe('isApplePrivateEmail', () => {
  it('recognises Hide My Email, case and padding included', () => {
    expect(isApplePrivateEmail('abc123@privaterelay.appleid.com')).toBe(true)
    expect(isApplePrivateEmail('  ABC123@PrivateRelay.AppleID.com  ')).toBe(true)
  })

  it('does not match ordinary addresses', () => {
    expect(isApplePrivateEmail('someone@icloud.com')).toBe(false)
    expect(isApplePrivateEmail('someone@gmail.com')).toBe(false)
    expect(isApplePrivateEmail('privaterelay.appleid.com@evil.com')).toBe(false)
    expect(isApplePrivateEmail(undefined)).toBe(false)
    expect(isApplePrivateEmail(null)).toBe(false)
  })
})
