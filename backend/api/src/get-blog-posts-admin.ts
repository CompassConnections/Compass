import {BLOG_FROM, BLOG_FULL_COLUMNS, BlogQueryRow, toAdminBlogPost} from 'api/helpers/blog'
import {APIHandler} from 'api/helpers/endpoint'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Every post in every state, bodies included, for `/admin/blog`.
 *
 * Bodies are included here where the public list omits them: the admin page is an editor, and every
 * row on it is one click away from being opened in the rich-text editor. Fetching them lazily would
 * put a spinner inside each post's edit box for no benefit — this list is a handful of rows read by
 * a handful of people.
 *
 * Drafts sort first: they are the only group that represents work owed.
 */
export const getBlogPostsAdmin: APIHandler<'get-blog-posts-admin'> = async (_, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const pg = createSupabaseDirectClient()

  const rows = await pg.any<BlogQueryRow>(
    `select ${BLOG_FULL_COLUMNS}
     ${BLOG_FROM}
     order by case b.status when 'draft' then 0 when 'published' then 1 else 2 end,
              coalesce(b.published_time, b.created_time) desc`,
  )

  return {posts: rows.map(toAdminBlogPost)}
}
