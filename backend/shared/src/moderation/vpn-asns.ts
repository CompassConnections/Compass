/**
 * Networks we treat as "signed up from behind a VPN".
 *
 * This is deliberately NOT "every datacenter ASN". Generic cloud (AWS, DigitalOcean, Vultr, OVH,
 * Contabo) is excluded: a developer signing up from a cloud IP is not a fraud signal, and in the
 * September 2026 audit none of those accounts had ever been banned. What's listed here is consumer
 * VPN exit infrastructure — the networks people rent by the month to hide where they are.
 *
 * Seeded two ways, both evidence-based rather than from someone else's blocklist:
 *
 *  1. Networks a confirmed-abuse account actually signed up from, found by ranking every ASN in
 *     `private_users.data->>'initialIpAddress'` by the share of its members we had already banned
 *     (see backend/scripts/2026-09-10-vpn-asn-dry-run.ts). At a 1.5% baseline ban rate, these ran
 *     8x-68x that.
 *  2. Two networks with no bans yet (tzulo, PV-HOSTED) that are unambiguously proxy/VPN hosting.
 *
 * To retire or add one, re-run the dry run and look at the "ASNs by banned share" table — that is
 * the maintenance loop for this list, not a subscription to a third-party feed.
 */
export const VPN_ASNS: Record<number, string> = {
  9009: 'M247',
  212238: 'CDNEXT (Datacamp)',
  60068: 'CDN77',
  136787: 'PacketHub',
  141039: 'PacketHub',
  147049: 'PacketHub',
  137409: 'GSL Networks',
  36352: 'ColoCrossing',
  206092: 'SecFirewall',
  396356: 'Latitude.sh',
  11878: 'tzulo',
  208172: 'PV-Hosted',
}

/**
 * Apple's Hide My Email relay. An address here means the person came through Apple's privacy
 * plumbing, which is the opposite of a fraud signal — iCloud Private Relay egresses from Cloudflare
 * and Akamai ranges, and every such member in the September 2026 audit was in good standing. Never
 * hold one of these, whatever the IP says.
 */
export const APPLE_PRIVATE_EMAIL_DOMAIN = '@privaterelay.appleid.com'

export const isApplePrivateEmail = (email: string | undefined | null) =>
  !!email && email.trim().toLowerCase().endsWith(APPLE_PRIVATE_EMAIL_DOMAIN)
