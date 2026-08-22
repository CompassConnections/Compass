import {BLOG_FROM, BLOG_SUMMARY_COLUMNS, BlogQueryRow, toBlogPostSummary} from 'api/helpers/blog'
import {APIHandler} from 'api/helpers/endpoint'
import {BLOG_POSTS_PER_PAGE} from 'common/blog/blog'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The `/blog` index. Published rows only — `draft` and `archived` never leave the server.
 *
 * Bodies are excluded. A blog index that shipped every post's full rich-text document would grow
 * without bound as the blog does, and the list renders none of it.
 *
 * Ordered by `published_time`, not `created_time`: those differ for anything written days before it
 * went out, and the date on the card is the one readers reason about.
 */
export const getBlogPosts: APIHandler<'get-blog-posts'> = async (props) => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.any<BlogQueryRow>(
    `select ${BLOG_SUMMARY_COLUMNS}
     ${BLOG_FROM}
     where b.status = 'published'
     order by b.published_time desc nulls last, b.id desc
     limit $(limit) offset $(offset)`,
    {limit: props.limit ?? BLOG_POSTS_PER_PAGE, offset: props.offset ?? 0},
  )

  return {posts: rows.map(toBlogPostSummary)}
}
