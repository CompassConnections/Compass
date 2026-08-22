import {type JSONContent} from '@tiptap/core'
import {
  AdminBlogPost,
  BlogAuthor,
  BlogPost,
  BlogPostStatus,
  BlogPostSummary,
  getReadingMinutes,
} from 'common/blog/blog'

/**
 * The columns as they come back from `blog_posts`, joined to `users` for the byline.
 *
 * The author fields are prefixed rather than nested because pg-promise returns a flat row; they are
 * all null when `author_id` is null (the account is gone) and the mappers below collapse that to a
 * missing byline rather than to a byline made of nulls.
 */
export type BlogQueryRow = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: JSONContent | string | null
  content_text: string
  cover_image_url: string | null
  status: BlogPostStatus
  author_id: string | null
  author_name: string | null
  author_username: string | null
  author_avatar_url: string | null
  published_time: string | null
  notified_time: string | null
  created_time: string
  updated_time: string
}

/**
 * Everything but the body. `content_text` is still selected — the reading-time estimate on the list
 * card is computed from it, and it is a fraction of the size of the JSONB document.
 */
export const BLOG_SUMMARY_COLUMNS = `b.id, b.slug, b.title, b.excerpt, b.content_text,
                                     b.cover_image_url, b.status, b.author_id, b.published_time,
                                     b.notified_time, b.created_time, b.updated_time,
                                     u.name       as author_name,
                                     u.username   as author_username,
                                     u.avatar_url as author_avatar_url`

export const BLOG_FULL_COLUMNS = `${BLOG_SUMMARY_COLUMNS}, b.content`

/** The join every blog read uses. Left, so a post whose author deleted their account still loads. */
export const BLOG_FROM = `from blog_posts b left join users u on u.id = b.author_id`

const toAuthor = (row: BlogQueryRow): BlogAuthor | null =>
  row.author_id === null || row.author_name === null || row.author_username === null
    ? null
    : {
        name: row.author_name,
        username: row.author_username,
        avatarUrl: row.author_avatar_url,
      }

export const toBlogPostSummary = (row: BlogQueryRow): BlogPostSummary => ({
  id: Number(row.id),
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  coverImageUrl: row.cover_image_url,
  author: toAuthor(row),
  publishedTime: row.published_time === null ? null : new Date(row.published_time).toISOString(),
  readingMinutes: getReadingMinutes(row.content_text ?? ''),
})

export const toBlogPost = (row: BlogQueryRow): BlogPost => ({
  ...toBlogPostSummary(row),
  // `{}` is the column default for a post created before anything was typed into the editor. Sent as
  // an empty document rather than as `{}`, which the TipTap renderer treats as a malformed node.
  content: row.content && Object.keys(row.content).length > 0 ? row.content : '',
})

export const toAdminBlogPost = (row: BlogQueryRow): AdminBlogPost => ({
  ...toBlogPost(row),
  status: row.status,
  notifiedTime: row.notified_time === null ? null : new Date(row.notified_time).toISOString(),
  createdTime: new Date(row.created_time).toISOString(),
  updatedTime: new Date(row.updated_time).toISOString(),
})
