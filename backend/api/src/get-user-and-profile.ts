import {debug} from 'common/logger'
import {ProfileRow} from 'common/profiles/profile'
import {
  isProfileVisibleTo,
  redactMemberOnlyProfile,
  redactMemberOnlyUser,
} from 'common/profiles/visibility'
import {convertUser} from 'common/supabase/users'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {type APIHandler} from './helpers/endpoint'

/**
 * A profile by username, projected down to what `viewerId` is allowed to read.
 *
 * `viewerId` is the signed-in reader, or undefined for an anonymous one. It decides two things: a
 * members-only profile is redacted to its display name for anyone not signed in (see
 * common/profiles/visibility), and `birth_date` is returned only to the profile's owner.
 */
export async function getUserAndProfile(username: string, viewerId?: string) {
  const pg = createSupabaseDirectClient()

  const user = await pg.oneOrNone('SELECT * FROM users WHERE username ILIKE $1', [username], (r) =>
    r ? convertUser(r) : null,
  )
  if (!user) return null

  // Fetch profile like getProfileRow does
  const profileRes = await pg.oneOrNone<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [
    user.id,
  ])

  if (!profileRes) return {user, profile: null}

  // Members-only profiles stop here. Nothing to hide is read at all — not the option tables, not the
  // row's own columns — so there is nothing for a caller to find in the response body, in the static
  // page props built from it, or in the OG tags derived from those.
  if (!isProfileVisibleTo(profileRes, viewerId)) {
    return {
      user: redactMemberOnlyUser(user),
      profile: redactMemberOnlyProfile(profileRes),
    }
  }

  // Parallel instead of sequential (like getProfileRow does in frontend)
  const [interestsRes, causesRes, workRes] = await Promise.all([
    pg.any(
      `SELECT interests.id 
            FROM profile_interests 
            JOIN interests ON profile_interests.option_id = interests.id 
            WHERE profile_interests.profile_id = $1`,
      [profileRes.id],
    ),
    pg.any(
      `SELECT causes.id 
            FROM profile_causes 
            JOIN causes ON profile_causes.option_id = causes.id 
            WHERE profile_causes.profile_id = $1`,
      [profileRes.id],
    ),
    pg.any(
      `SELECT work.id 
            FROM profile_work 
            JOIN work ON profile_work.option_id = work.id 
            WHERE profile_work.profile_id = $1`,
      [profileRes.id],
    ),
  ])

  const profileWithItems = {
    ...profileRes,
    // A profile page shows an age, and `age` is derived from the date server-side, so the date has
    // no reason to leave — to anyone but the owner, who needs it back to edit it. Nulled rather than
    // dropped so the row keeps the shape callers type against.
    birth_date: viewerId === user.id ? (profileRes.birth_date ?? null) : null,
    interests: interestsRes.map((r: any) => String(r.id)),
    causes: causesRes.map((r: any) => String(r.id)),
    work: workRes.map((r: any) => String(r.id)),
  }

  return {user, profile: profileWithItems}
}

/**
 * The public read: unauthenticated, cacheable, and the one the statically generated profile page is
 * built from. A signed-in caller is still recognised (the endpoint is `authed: false`, not
 * "authentication ignored"), so a member hitting it gets the full profile; everyone else gets a
 * members-only profile redacted to its display name.
 */
export const getUserAndProfileHandler: APIHandler<'get-user-and-profile'> = async (
  {username},
  auth,
) => {
  const result = await getUserAndProfile(username, auth?.uid)
  debug(result)
  return {
    user: result?.user,
    profile: result?.profile,
  }
}

/**
 * The same lookup, for a client that knows it is signed in.
 *
 * `get-user-and-profile` would serve this too, but `authed: false` means the web `api()` helper does
 * not wait for Firebase to restore the session before firing — so a page loading straight from a
 * cached user could ask for its own profile before the token exists and get the anonymous redaction
 * back. Declaring the requirement makes the wait happen and turns a silently empty profile into an
 * error.
 */
export const getProfileHandler: APIHandler<'get-profile'> = async ({username}, auth) => {
  const result = await getUserAndProfile(username, auth.uid)
  return {
    user: result?.user,
    profile: result?.profile,
  }
}
