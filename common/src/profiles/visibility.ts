import {ProfileRow} from 'common/profiles/profile'
import {User} from 'common/user'

/**
 * Who is allowed to read a profile, and what is left of one when they are not.
 *
 * `profiles.visibility` has two values: 'public' (anyone) and 'member' (signed-in members only). The
 * column defaults to 'member', so most profiles on the site are gated — which is exactly why this
 * cannot be a rendering decision. A component that merely hides a field has still shipped it: in the
 * API response, in the page's `__NEXT_DATA__`, in the OG tags. The gate belongs where the response is
 * assembled, and the redactions below are the whole of what a non-member may receive.
 *
 * The one thing a members-only profile still says out loud is the display name — enough for a link to
 * make sense, and for the person to recognise their own page — so `user.name` survives and nothing
 * else does.
 */
export const isProfileVisibleTo = (
  profile: {visibility?: string | null} | null | undefined,
  viewerId: string | null | undefined,
) => !profile || profile.visibility !== 'member' || !!viewerId

/**
 * The identity columns of a members-only profile, and nothing more: that it exists, whose it is,
 * whether it is gated, whether it is disabled. Every field a reader could learn something from is
 * dropped rather than blanked, so it cannot be read back out of the JSON either.
 *
 * `id` is deliberately absent too. `profile_interests`, `profile_causes` and `profile_work` join on
 * it and are readable with the public anon key, so handing it out would give back the tags the rest
 * of this removes.
 */
export function redactMemberOnlyProfile<
  T extends Pick<ProfileRow, 'user_id' | 'visibility' | 'disabled'>,
>(profile: T): T {
  const {user_id, visibility, disabled} = profile
  // The result is not a whole row and does not claim to be one at runtime; the cast keeps callers
  // typed against `ProfileRow` the way the un-redacted branch is.
  return {user_id, visibility, disabled} as unknown as T
}

/** The photo is profile content, so it goes with the rest of it. Name and username stay. */
export function redactMemberOnlyUser<T extends User>(user: T): T {
  return {...user, avatarUrl: ''}
}
