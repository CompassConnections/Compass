import {isBlockedBetween} from 'api/helpers/blocks'
import {isAdminId} from 'common/envs/constants'
import {
  canViewerSeeField,
  isProfileVisibleTo,
  type ProfileFieldKey,
  type ProfileViewer,
} from 'common/profiles/visibility'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Whether `ownerId` has approved `viewerId` to see the fields they keep for approved people
 * (`profile_access`, docs/profile-visibility.md). One-directional, and only an *approved* row counts —
 * a pending request shows nothing.
 */
export const isApprovedViewer = async (viewerId: string | undefined, ownerId: string) => {
  if (!viewerId || viewerId === ownerId) return false
  const pg = createSupabaseDirectClient()
  const row = await pg.oneOrNone(
    `select 1 from profile_access
     where owner_id = $1 and viewer_id = $2 and status = 'approved'`,
    [ownerId, viewerId],
  )
  return !!row
}

/**
 * Who is reading `ownerId`'s profile, in the terms `redactProfileFor` asks in. The one place the
 * four answers are worked out, so every endpoint that returns profile content agrees on them.
 */
export const getProfileViewer = async (
  viewerId: string | undefined,
  ownerId: string,
): Promise<ProfileViewer> => {
  const isOwner = !!viewerId && viewerId === ownerId
  return {
    id: viewerId,
    isOwner,
    isAdmin: !!viewerId && isAdminId(viewerId),
    isConnected: isOwner ? false : await isApprovedViewer(viewerId, ownerId),
  }
}

/**
 * Whether `viewerId` may read what `targetId` has published on their profile — their compatibility
 * answers, the comments left on their page, anything a visitor to the profile would be shown.
 *
 * One rule for every per-profile read, so the endpoints agree with each other and with the profile
 * page itself: the owner always may; nobody but an administrator may read a disabled or banned member; a members-only
 * profile needs a signed-in viewer (`isProfileVisibleTo`, the same gate `get-user-and-profile`
 * applies); and a block in either direction closes it. Callers answer "may not" with an empty result
 * rather than an error, so the response does not say which of these applied — whether a profile is
 * members-only, or who has blocked whom, is itself a fact about another member.
 *
 * These reads used to go straight from the browser to PostgREST on the anon key, where none of this
 * could be checked (see docs/database-schema.md, "Client read access").
 *
 * `field` narrows it to one hideable field — `answers` for the compatibility answers, `endorsements`
 * for the comments — so a member who keeps that field for approved people, or for nobody, is
 * answered for with the same empty result as the cases above.
 */
export const canReadProfileContent = async (
  viewerId: string | undefined,
  targetId: string,
  field?: ProfileFieldKey,
) => {
  if (viewerId === targetId) return true

  const pg = createSupabaseDirectClient()
  const target = await pg.oneOrNone<{
    visibility: string | null
    field_visibility: unknown
    disabled: boolean
    is_banned_from_posting: boolean | null
  }>(
    `select profiles.visibility, profiles.field_visibility, profiles.disabled, users.is_banned_from_posting
     from profiles
     join users on users.id = profiles.user_id
     where profiles.user_id = $1`,
    [targetId],
  )
  if (!target) return false
  // Administrators moderate from the whole profile, so a paused or banned member's answers and
  // endorsements stay readable to them — as the profile itself does (`get-user-and-profile`) — and so
  // do fields set to `only_me`, through `getProfileViewer` below. Nobody else gets past this line.
  const viewerIsAdmin = !!viewerId && isAdminId(viewerId)
  if ((target.disabled || target.is_banned_from_posting) && !viewerIsAdmin) return false
  if (!isProfileVisibleTo(target, viewerId)) return false
  // A block does not close it for an administrator either, for the same reason.
  if (viewerId && !viewerIsAdmin && (await isBlockedBetween(viewerId, [targetId]))) return false
  if (field && !canViewerSeeField(target, field, await getProfileViewer(viewerId, targetId)))
    return false
  return true
}
