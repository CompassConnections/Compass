jest.mock('shared/moderation/vpn-check')
jest.mock('shared/monitoring/log')

import {getIp} from 'shared/analytics'
import {
  addBannedNetworksOf,
  BANNED_IP_TTL_DAYS,
  toBannableAddress,
} from 'shared/moderation/banned-networks'
import * as vpnCheck from 'shared/moderation/vpn-check'

describe('toBannableAddress', () => {
  it('keeps IPv4 and IPv6 as they are', () => {
    expect(toBannableAddress('197.211.63.217')).toBe('197.211.63.217')
    expect(toBannableAddress(' 2607:fb90:bd95:dbcd:ac39:6c97:4e35:3fed ')).toBe(
      '2607:fb90:bd95:dbcd:ac39:6c97:4e35:3fed',
    )
  })

  it('unwraps IPv4-mapped IPv6, so one person is one address', () => {
    expect(toBannableAddress('::ffff:197.211.63.217')).toBe('197.211.63.217')
    expect(toBannableAddress('::ffff:c5d3:3fd9')).toBe('197.211.63.217')
  })

  it('drops a zone id', () => {
    expect(toBannableAddress('fe80::1%eth0')).toBe('fe80::1')
  })

  it('rejects anything that is not an address', () => {
    expect(toBannableAddress('')).toBeNull()
    expect(toBannableAddress(null)).toBeNull()
    expect(toBannableAddress('mockIP')).toBeNull()
    expect(toBannableAddress('1.2.3.4; drop table users')).toBeNull()
  })
})

describe('addBannedNetworksOf', () => {
  const makePg = (row: {ip: string | null; device_token: string | null} | null) => ({
    oneOrNone: jest.fn().mockResolvedValue(row),
    none: jest.fn().mockResolvedValue(undefined),
  })
  const statements = (pg: ReturnType<typeof makePg>) =>
    pg.none.mock.calls.map(([sql, params]) => ({sql: String(sql), params}))

  beforeEach(() => {
    jest.resetAllMocks()
    ;(vpnCheck.lookupVpnNetwork as jest.Mock).mockResolvedValue(null)
  })

  it('replaces what the user contributed before, then adds their IP and device', async () => {
    const pg = makePg({ip: '197.211.63.217', device_token: 'abc123'})
    await addBannedNetworksOf(pg as any, 'u1')
    const [del, ip, device] = statements(pg)
    expect(del.sql).toMatch(/^delete from banned_networks/)
    expect(del.params).toEqual(['u1'])
    expect(ip.sql).toContain('set_masklen')
    expect(ip.params).toEqual(['197.211.63.217', 'u1', BANNED_IP_TTL_DAYS])
    expect(device.params).toEqual(['abc123', 'u1'])
  })

  it('leaves a VPN address off the list but still bans the device', async () => {
    ;(vpnCheck.lookupVpnNetwork as jest.Mock).mockResolvedValue({asn: 9009, name: 'M247'})
    const pg = makePg({ip: '37.120.236.26', device_token: 'abc123'})
    await addBannedNetworksOf(pg as any, 'u1')
    const inserts = statements(pg).filter((s) => s.sql.startsWith('insert'))
    expect(inserts).toHaveLength(1)
    expect(inserts[0].params).toEqual(['abc123', 'u1'])
  })

  it('skips an IP that does not parse', async () => {
    const pg = makePg({ip: 'garbage', device_token: null})
    await addBannedNetworksOf(pg as any, 'u1')
    expect(statements(pg).filter((s) => s.sql.startsWith('insert'))).toHaveLength(0)
    expect(vpnCheck.lookupVpnNetwork).not.toHaveBeenCalled()
  })
})

describe('getIp', () => {
  const req = (xff: string | string[] | undefined, remoteAddress = '10.0.0.1') =>
    ({headers: xff === undefined ? {} : {'x-forwarded-for': xff}, socket: {remoteAddress}}) as any

  it('takes the entry Google appended, not one the client sent', () => {
    expect(getIp(req('6.6.6.6, 197.211.63.217'))).toBe('197.211.63.217')
    expect(getIp(req(['6.6.6.6', '197.211.63.217']))).toBe('197.211.63.217')
  })

  it('handles a single entry', () => {
    expect(getIp(req('197.211.63.217'))).toBe('197.211.63.217')
  })

  it('falls back to the socket when there is no header', () => {
    expect(getIp(req(undefined))).toBe('10.0.0.1')
  })
})
