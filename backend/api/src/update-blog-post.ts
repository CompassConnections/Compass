import {BLOG_FROM, BLOG_FULL_COLUMNS, BlogQueryRow, toAdminBlogPost} from 'api/helpers/blog'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {BlogPostStatus, MAX_BLOG_CONTENT_LENGTH} from 'common/blog/blog'
import {parseJsonContentToText} from 'common/util/parse'
import {createBlogPostNotifications} from 'shared/create-notification'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Edit, publish, notify about, or take down one post.
 *
 * Every field is independently optional, the same contract as `update-spotlight`: the publish button
 * sends only a status, the editor sends only the body. `undefined` leaves a column alone and `null`
 * clears it, so publishing a post cannot silently wipe its excerpt.
 *
 * Three rules are enforced here and nowhere else, because all three are about things that cannot be
 * undone once they have happened:
 *
 *   1. **The slug freezes at publication.** Before that it is a typo to fix; after it, it is in the
 *      notification every member received, in whatever anyone shared, and in whatever a crawler
 *      indexed. Changing it then does not rename the post, it breaks every existing link to it.
 *   2. **`published_time` is set once.** Re-editing a year-old post must not float it back to the
 *      top of /blog, so the first publish stamps the date and every later one leaves it alone.
 *   3. **The broadcast fires at most once.** `notified_time` is the interlock. Sending "we published
 *      something" to the whole membership twice is not a small mistake, and an admin who fixes a typo
 *      and re-saves must not be the one who discovers that.
 *
 * There is deliberately no delete — `status: 'archived'` is the takedown and it is reversible. A hard
 * delete would also free the slug for a different post to claim under a URL people already have.
 */
export const updateBlogPost: APIHandler<'update-blog-post'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const {id, slug, title, excerpt, content, coverImageUrl, status, notificationText} = props

  // Flattened before the write for the same reason as in `create-blog-post`: `content_text` is the
  // one string every derived read (reading time now, search later) is computed from.
  const contentText = content === undefined ? null : parseJsonContentToText(content)
  if (contentText !== null && contentText.length > MAX_BLOG_CONTENT_LENGTH) {
    throw APIErrors.badRequest(
      `That post is ${contentText.length} characters; the limit is ${MAX_BLOG_CONTENT_LENGTH}`,
    )
  }

  const pg = createSupabaseDirectClient()

  const current = await pg.oneOrNone<{
    slug: string
    status: BlogPostStatus
    published_time: string | null
    notified_time: string | null
  }>(`select slug, status, published_time, notified_time from blog_posts where id = $(id)`, {id})

  if (!current) throw APIErrors.notFound('Blog post not found')

  const everPublished = current.published_time !== null

  if (slug !== undefined && slug !== current.slug && everPublished) {
    throw APIErrors.badRequest(
      'This post has already been published, so its URL is fixed. Take it down and publish a new post if the slug really has to change.',
    )
  }

  // The state the post ends this call in, which is what the notification decision below is about —
  // not the state it was in, and not whichever of the two the caller happened to mention.
  const nextStatus: BlogPostStatus = status ?? current.status
  const willBePublished = nextStatus === 'published'

  // An explicit refusal rather than a silent no-op, on both counts. An admin who typed a
  // notification and pressed publish is entitled to find out that nobody got it, and to find out now
  // rather than by checking their own notifications an hour later.
  if (notificationText !== undefined) {
    if (!willBePublished) {
      throw APIErrors.badRequest(
        'A post has to be published to announce it. Set the status to published in the same call.',
      )
    }
    if (current.notified_time !== null) {
      throw APIErrors.badRequest('Everyone has already been notified about this post.')
    }
  }

  const shouldNotify = notificationText !== undefined && willBePublished

  const updated = await pg.one<{slug: string; title: string; cover_image_url: string | null}>(
    `update blog_posts
     set slug            = coalesce($(slug), slug),
         title           = coalesce($(title), title),
         excerpt         = case when $(excerptProvided) then $(excerpt) else excerpt end,
         -- Cast explicit rather than left to inference: the bound parameter arrives untyped, and a
         -- coalesce(unknown, jsonb) would otherwise be resolved by Postgres rather than by us.
         content         = coalesce($(content)::jsonb, content),
         content_text    = coalesce($(contentText), content_text),
         cover_image_url = case when $(coverProvided) then $(coverImageUrl) else cover_image_url end,
         status          = coalesce($(status), status),
         -- Stamped by the first publish and never moved again, so the date on the card stays the date
         -- the post went out. Archiving and re-publishing keeps the original date for the same reason.
         published_time  = case
                               when published_time is null and coalesce($(status), status) = 'published'
                                   then now()
                               else published_time end,
         updated_time    = now()
     where id = $(id)
     returning slug, title, cover_image_url`,
    {
      id,
      slug: slug ?? null,
      title: title ?? null,
      excerpt: excerpt?.trim() || null,
      excerptProvided: excerpt !== undefined,
      content: content ?? null,
      contentText,
      coverImageUrl: coverImageUrl || null,
      coverProvided: coverImageUrl !== undefined,
      status: status ?? null,
    },
  )

  let notifiedCount = 0

  if (shouldNotify) {
    // Claimed before sending, and conditionally: two publish clicks racing each other both reach the
    // check above with `notified_time` still null, and only the one that wins this update goes on to
    // broadcast. The alternative — stamping it afterwards — leaves the window open for exactly as
    // long as it takes to write a row per member, which is the slowest part of the whole operation.
    const claimed = await pg.oneOrNone<{id: string}>(
      `update blog_posts set notified_time = now()
       where id = $(id) and notified_time is null
       returning id`,
      {id},
    )

    if (claimed) {
      const {count} = await createBlogPostNotifications({
        slug: updated.slug,
        title: updated.title,
        notificationText: notificationText!,
        coverImageUrl: updated.cover_image_url,
      })
      notifiedCount = count
    }
  }

  // Re-read through the byline join so the response is the same shape `get-blog-posts-admin` returns.
  const row = await pg.one<BlogQueryRow>(
    `select ${BLOG_FULL_COLUMNS} ${BLOG_FROM} where b.id = $(id)`,
    {id},
  )

  return {post: toAdminBlogPost(row), notifiedCount}
}
