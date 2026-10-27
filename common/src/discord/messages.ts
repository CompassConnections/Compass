import {JSONContent} from '@tiptap/core'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {richTextToString} from 'common/util/parse'

type DiscordMember = {name: string; username: string}

const profileLink = (member: DiscordMember) =>
  `[**${member.name}**](${DEPLOYED_WEB_URL}/${member.username})`

/**
 * The #members announcement for a new profile.
 *
 * When someone was brought by a current member, that member is named. It is the only place an
 * introduction is visible to anyone beyond the two people involved — credit in front of the room is
 * the whole reward for bringing someone, and it costs nothing to give.
 *
 * `referrer` is null both when nobody referred them and when the recorded referrer resolves to no
 * member: `?referrer=` is whatever was in the URL, and a dead link in a public channel is worse than
 * no mention at all.
 */
export const newMemberDiscordMessage = (
  member: DiscordMember,
  referrer: DiscordMember | null,
): string =>
  `${profileLink(member)} just created a profile` +
  (referrer ? `, brought by ${referrer.username}` : '')

type DiscordProposal = {id: number; title: string; description?: JSONContent}

// A proposal's description is a whole document; the channel post is a pointer to it, not a copy. Long
// enough to tell whether the proposal is worth opening, short enough that ten of them in a row still read
// as a list.
const EXCERPT_MAX_CHARS = 300

const excerpt = (description?: JSONContent) => {
  const text = richTextToString(description).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length <= EXCERPT_MAX_CHARS ? text : `${text.slice(0, EXCERPT_MAX_CHARS).trimEnd()}…`
}

/**
 * The #suggestions announcement for a new proposal.
 *
 * `creator` is null when the proposal was posted anonymously. Anonymity is a promise made at the moment
 * the box was ticked — it hides the author on the card and throughout the discussion — and naming them in
 * a public channel would break it in the one place they cannot see, so the caller passes null rather than
 * this function deciding.
 */
export const newProposalDiscordMessage = (
  proposal: DiscordProposal,
  creator: DiscordMember | null,
): string => {
  const opener = creator
    ? `${profileLink(creator)} opened a new proposal`
    : 'A new anonymous proposal'
  const body = excerpt(proposal.description)
  return (
    `${opener}: [**${proposal.title}**](${DEPLOYED_WEB_URL}/vote/${proposal.id})` +
    (body ? `\n${body}` : '')
  )
}

/**
 * The #reports post for a signup that was automatically put on hold for coming through a VPN.
 *
 * Written for the person who has to act on it: the network and the raw IP are there so a moderator
 * can sanity-check the call, and the profile link is there because the decision is nearly always
 * made by looking at the profile. It says the hold is provisional and names the ASN, because most of
 * these will be genuine members who value their privacy and the reviewer should start from that
 * assumption rather than from "caught one".
 */
export const vpnSignupDiscordMessage = (
  member: DiscordMember,
  network: {asn: number; name: string},
  ip: string,
): string =>
  `🔒 **Signup behind a VPN — on hold pending review**\n` +
  `**Member:** ${profileLink(member)} (@${member.username})\n` +
  `**Network:** ${network.name} (AS${network.asn})\n` +
  `**IP:** \`${ip}\`\n` +
  `They can browse but not message anyone until someone lifts the hold. ` +
  `Most VPN users are genuine — check the profile before deciding.`

/**
 * The #reports post for a signup whose IP or device is on the banned-networks list — the network or
 * device a confirmed abuser used.
 *
 * Names the earlier account so a moderator can put the two side by side, which is how the call is
 * actually made. An IP match is worded as a hint, not a verdict: addresses are shared and reassigned.
 */
export const bannedNetworkSignupDiscordMessage = (
  member: DiscordMember,
  match: {
    kind: 'ip' | 'device'
    network: string | null
    sourceUsername: string | null
    note: string | null
  },
  ip: string,
): string =>
  (match.kind === 'device'
    ? `⛔ **Signup from a banned device — locked out**\n`
    : `🔒 **Signup from a banned network — on hold pending review**\n`) +
  `**Member:** ${profileLink(member)} (@${member.username})\n` +
  `**IP:** \`${ip}\`` +
  (match.kind === 'ip' && match.network ? ` (in banned \`${match.network}\`)` : '') +
  `\n` +
  `**Banned because of:** ` +
  (match.sourceUsername
    ? `[@${match.sourceUsername}](${DEPLOYED_WEB_URL}/${match.sourceUsername})`
    : (match.note ?? 'a hand-added entry')) +
  `\n` +
  (match.kind === 'device'
    ? `Same browser as a confirmed abuser. Lift the ban if it turns out to be a shared computer.`
    : `They can browse but not message anyone until someone lifts the hold. ` +
      `Addresses are shared and reassigned — compare the two profiles before deciding.`)
