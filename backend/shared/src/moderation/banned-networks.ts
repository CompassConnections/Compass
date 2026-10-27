import {log} from 'shared/monitoring/log'
import {SupabaseDirectClient} from 'shared/supabase/init'

import {parseIp} from './ip'
import {lookupVpnNetwork} from './vpn-check'

/**
 * Networks and devices that confirmed abusers signed up from, checked when someone new signs up.
 * Table and the reasoning behind its shape: backend/supabase/migrations/20261024_add_banned_networks.sql.
 *
 * Only `confirmed_abuse` bans feed it. A provisional hold is not a verdict — most turn out to be
 * genuine — and copying a false positive's IP onto everyone else behind that address would spread
 * one mistake to strangers.
 */

/**
 * How long an IP copied from a ban keeps counting. Home IPv4 addresses get reassigned and carrier
 * NAT puts hundreds of people behind one, so a permanent IP ban ends up landing on whoever inherits
 * the address. A device token names one browser and does not expire.
 */
export const BANNED_IP_TTL_DAYS = 90

export type BannedNetworkMatch = {
  kind: 'ip' | 'device'
  network: string | null
  sourceUserId: string | null
  sourceUsername: string | null
  note: string | null
}

/**
 * The address as Postgres should read it, or null when it isn't one. IPv4-mapped IPv6
 * (`::ffff:1.2.3.4`, what Node reports for an IPv4 client on a dual-stack socket) is unwrapped, so
 * the same person is not two different addresses depending on how they connected.
 */
export function toBannableAddress(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim().replace(/%.*$/, '')
  const parsed = parseIp(s)
  if (!parsed) return null
  if (parsed.family === 6 && parsed.value >> 32n === 0xffffn) {
    const v4 = parsed.value & 0xffffffffn
    return [24n, 16n, 8n, 0n].map((shift) => (v4 >> shift) & 0xffn).join('.')
  }
  return s
}

/**
 * The ban entry this signup matches, if any. A device match wins over an IP match: a device token
 * names one browser, while an address can be shared by a whole café.
 */
export async function findBannedNetwork(
  pg: SupabaseDirectClient,
  ip: string | null | undefined,
  deviceToken: string | null | undefined,
): Promise<BannedNetworkMatch | null> {
  const address = toBannableAddress(ip)
  if (!address && !deviceToken) return null
  const row = await pg.oneOrNone<{
    network: string | null
    device_token: string | null
    source_user_id: string | null
    source_username: string | null
    note: string | null
  }>(
    `select b.network::text as network, b.device_token, b.source_user_id, u.username as source_username, b.note
     from banned_networks b
     left join users u on u.id = b.source_user_id
     where (($1::inet is not null and b.network >>= $1::inet)
         or ($2::text is not null and b.device_token = $2))
       and (b.expires_at is null or b.expires_at > now())
     order by (b.device_token is not null) desc, b.created_at desc
     limit 1`,
    [address, deviceToken || null],
  )
  if (!row) return null
  return {
    kind: row.device_token ? 'device' : 'ip',
    network: row.network,
    sourceUserId: row.source_user_id,
    sourceUsername: row.source_username,
    note: row.note,
  }
}

/**
 * Copy a confirmed abuser's signup IP and device token into the list. Idempotent: whatever this user
 * contributed before is replaced, so banning twice does not leave duplicates.
 *
 * An address on a commercial VPN is left out. Its exit IPs carry many unrelated people, and a signup
 * from one is already held for review by the VPN check in create-user-and-profile.ts.
 */
export async function addBannedNetworksOf(pg: SupabaseDirectClient, userId: string) {
  const data = await pg.oneOrNone<{ip: string | null; device_token: string | null}>(
    `select data ->> 'initialIpAddress' as ip, data ->> 'initialDeviceToken' as device_token
     from private_users
     where id = $1`,
    [userId],
  )
  await removeBannedNetworksOf(pg, userId)
  if (!data) return

  const address = toBannableAddress(data.ip)
  if (address) {
    const vpn = await lookupVpnNetwork(address)
    if (vpn) {
      log.info('Not banning a VPN address', {userId, network: vpn.name})
    } else {
      await pg.none(
        `insert into banned_networks (network, source_user_id, expires_at)
         -- The /32 or /64 a ban covers for this address.
         values (network(set_masklen($1::inet, case when family($1::inet) = 4 then 32 else 64 end)),
                 $2, now() + make_interval(days => $3))`,
        [address, userId, BANNED_IP_TTL_DAYS],
      )
    }
  }
  if (data.device_token) {
    await pg.none(`insert into banned_networks (device_token, source_user_id) values ($1, $2)`, [
      data.device_token,
      userId,
    ])
  }
}

/** Undo `addBannedNetworksOf`: the ban was lifted or downgraded. Hand-added rows are untouched. */
export async function removeBannedNetworksOf(pg: SupabaseDirectClient, userId: string) {
  await pg.none(`delete from banned_networks where source_user_id = $1`, [userId])
}
