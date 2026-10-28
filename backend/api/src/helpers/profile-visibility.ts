import {isBlockedBetween} from 'api/helpers/blocks'
import {isProfileVisibleTo} from 'common/profiles/visibility'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Whether `viewerId` may read what `targetId` has published on their profile — their compatibility
 * answers, the comments left on their page, anything a visitor to the profile would be shown.
 *
 * One rule for every per-profile read, so the endpoints agree with each other and with the profile
 * page itself: the owner always may; nobody may read a disabled or banned member; a members-only
 * profile needs a signed-in viewer (`isProfileVisibleTo`, the same gate `get-user-and-profile`
 * applies); and a block in either direction closes it. Callers answer "may not" with an empty result
 * rather than an error, so the response does not say which of these applied — whether a profile is
 * members-only, or who has blocked whom, is itself a fact about another member.
 *
 * These reads used to go straight from the browser to PostgREST on the anon key, where none of this
 * could be checked (see docs/database-schema.md, "Client read access").
 */
export const canReadProfileContent = async (viewerId: string | undefined, targetId: string) => {
  if (viewerId === targetId) return true

  const pg = createSupabaseDirectClient()
  const target = await pg.oneOrNone<{
    visibility: string | null
    disabled: boolean
    is_banned_from_posting: boolean | null
  }>(
    `select profiles.visibility, profiles.disabled, users.is_banned_from_posting
     from profiles
     join users on users.id = profiles.user_id
     where profiles.user_id = $1`,
    [targetId],
  )
  if (!target || target.disabled || target.is_banned_from_posting) return false
  if (!isProfileVisibleTo(target, viewerId)) return false
  if (viewerId && (await isBlockedBetween(viewerId, [targetId]))) return false
  return true
}
