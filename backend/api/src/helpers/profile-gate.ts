import {isAdminId, isModUsername} from 'common/envs/constants'
import {ProfileGateIssues, profileGateIssues} from 'common/moderation/first-message'
import {User} from 'common/user'
import {SupabaseDirectClient} from 'shared/supabase/init'

/**
 * Staff (admins and mod usernames) are exempt from the first-message rules: support, moderation and
 * onboarding all legitimately open many conversations with members who have given them nothing to
 * go on.
 */
export const isStaff = (user: Pick<User, 'id' | 'username'>) =>
  isAdminId(user.id) || isModUsername(user.username)

/**
 * What is still missing from this member's own profile before they may start a conversation, or
 * null when nothing is. The bio is measured on the trigger-maintained `profiles.bio_text`; a member
 * with no profile row at all has nothing filled in.
 *
 * One query, used both when a conversation is actually created and by `get-profile-gate`, which the
 * composer asks on open — so what the composer shows before the first keystroke is exactly what the
 * API would refuse.
 */
export async function ownProfileGateIssues(
  pg: SupabaseDirectClient,
  userId: string,
): Promise<ProfileGateIssues | null> {
  const own = await pg.oneOrNone<{bio_chars: string; answers: string}>(
    `select coalesce(length(p.bio_text), 0)                                            as bio_chars,
            (select count(*) from compatibility_answers a where a.creator_id = $1) as answers
     from profiles p
     where p.user_id = $1`,
    [userId],
  )
  return profileGateIssues({
    bioChars: Number(own?.bio_chars ?? 0),
    answers: Number(own?.answers ?? 0),
  })
}
