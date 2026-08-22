import {BLOG_FROM, BLOG_FULL_COLUMNS, BlogQueryRow, toBlogPost} from 'api/helpers/blog'
import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * One post by slug, body included.
 *
 * `status = 'published'` is in the query rather than checked afterwards, so a draft is not merely
 * hidden by the page — it never reaches the response, and guessing the slug of an unpublished post
 * gets you the same `null` as guessing a slug that was never used.
 *
 * Answers `null` rather than 404ing, because the caller is a statically-generated page that has its
 * own not-found state to render, and because this response is CDN-cached: a 404 body cached under a
 * slug that is published minutes later is worse than a cached `null` the page can retry past.
 */
export const getBlogPost: APIHandler<'get-blog-post'> = async (props) => {
  const pg = createSupabaseDirectClient()

  const row = await pg.oneOrNone<BlogQueryRow>(
    `select ${BLOG_FULL_COLUMNS}
     ${BLOG_FROM}
     where b.slug = $(slug)
       and b.status = 'published'`,
    {slug: props.slug},
  )

  return {post: row ? toBlogPost(row) : null}
}
