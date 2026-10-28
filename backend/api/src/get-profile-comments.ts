import {type APIHandler} from 'api/helpers/endpoint'
import {canReadProfileContent} from 'api/helpers/profile-visibility'
import {convertComment} from 'common/supabase/comment'
import {Row} from 'common/supabase/utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getPrivateUser} from 'shared/utils'

/**
 * The comments on one member's profile, as the caller may see them.
 *
 * Open to signed-out visitors, because a public profile shows its comments to them too; a signed-in
 * caller is still recognised, which is what lets a member see the comments on a members-only page.
 * Three things are kept back: hidden comments (the moderator's switch — the row stays so the hide can
 * be undone, but it never leaves the server), everything on a profile the caller may not read
 * (`canReadProfileContent`), and comments written by someone the caller has blocked or been blocked
 * by, since a block is meant to make the other person disappear and not only their messages.
 */
export const getProfileComments: APIHandler<'get-profile-comments'> = async ({userId}, auth) => {
  if (!(await canReadProfileContent(auth?.uid, userId))) return {comments: []}

  const pg = createSupabaseDirectClient()
  const [rows, viewer] = await Promise.all([
    pg.manyOrNone<Row<'profile_comments'>>(
      `select * from profile_comments
       where on_user_id = $1 and not hidden
       order by created_time`,
      [userId],
    ),
    auth ? getPrivateUser(auth.uid) : null,
  ])

  const hiddenAuthors = new Set([
    ...(viewer?.blockedUserIds ?? []),
    ...(viewer?.blockedByUserIds ?? []),
  ])

  return {
    comments: rows.filter((row) => !hiddenAuthors.has(row.user_id)).map(convertComment),
  }
}
