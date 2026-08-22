import {BLOG_FROM, BLOG_FULL_COLUMNS, BlogQueryRow, toAdminBlogPost} from 'api/helpers/blog'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {MAX_BLOG_CONTENT_LENGTH} from 'common/blog/blog'
import {parseJsonContentToText} from 'common/util/parse'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Create a post. Always as a `draft`, never published, and never broadcast.
 *
 * Publishing is a second, separate call to `update-blog-post`, for the same reason creating a
 * spotlight cannot publish one: the thing that makes a post public also mails every member, and an
 * endpoint that can do that as a side effect of "save what I just typed" is one mis-click away from
 * sending an unfinished draft to everybody.
 *
 * Admins only, not mods — publishing under the Compass name is an editorial act, not a moderation
 * one. Same split as `create-spotlight`.
 */
export const createBlogPost: APIHandler<'create-blog-post'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const {slug, title, excerpt, content, coverImageUrl} = props

  // Flattened once, here, so that every consumer of `content_text` — reading time today, search
  // later — reads the same string, and none of them has to know how to walk a ProseMirror tree.
  const contentText = parseJsonContentToText(content ?? null)
  if (contentText.length > MAX_BLOG_CONTENT_LENGTH) {
    throw APIErrors.badRequest(
      `That post is ${contentText.length} characters; the limit is ${MAX_BLOG_CONTENT_LENGTH}`,
    )
  }

  const pg = createSupabaseDirectClient()

  // The unique index on `slug` is the real guard — two admins creating the same slug at once is not
  // a race we can win with a pre-check — so this catches it after the fact and reports it in terms of
  // what the admin did rather than as a constraint name.
  const existing = await pg.oneOrNone<{status: string}>(
    `select status from blog_posts where slug = $(slug)`,
    {slug},
  )
  if (existing) {
    throw APIErrors.badRequest(
      `The slug “${slug}” is already taken by a ${existing.status} post — edit that one, or pick another slug`,
    )
  }

  const inserted = await pg.one<{id: string}>(
    `insert into blog_posts (slug, title, excerpt, content, content_text, cover_image_url, author_id)
     values ($(slug), $(title), $(excerpt), $(content), $(contentText), $(coverImageUrl), $(authorId))
     returning id`,
    {
      slug,
      title,
      excerpt: excerpt?.trim() || null,
      content: content ?? {},
      contentText,
      coverImageUrl: coverImageUrl || null,
      authorId: auth.uid,
    },
  )

  // Re-read through the byline join rather than returning the inserted row, so the admin page gets
  // exactly the same shape as `get-blog-posts-admin` and does not need a second code path for the
  // row it just created.
  const row = await pg.one<BlogQueryRow>(
    `select ${BLOG_FULL_COLUMNS} ${BLOG_FROM} where b.id = $(id)`,
    {id: inserted.id},
  )

  return {post: toAdminBlogPost(row)}
}
