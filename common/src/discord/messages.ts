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
