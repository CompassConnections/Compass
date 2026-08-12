import {DEPLOYED_WEB_URL} from 'common/envs/constants'

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
