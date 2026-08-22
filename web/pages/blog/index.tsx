import clsx from 'clsx'
import {BlogPostSummary, formatBlogDate} from 'common/blog/blog'
import {typedAPICall} from 'common/util/api'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Avatar} from 'web/components/widgets/avatar'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow, surface, surfaceHover} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'
import {isNativeMobile} from 'web/lib/util/webview'

/**
 * The blog index.
 *
 * Prefetched at build time and re-read on the client, the same pattern as `/testimonials`: the
 * prefetch is what a crawler and a cold visitor see immediately, and the client read is what makes a
 * post published ten minutes ago appear without waiting for the next deploy. The API response is
 * CDN-cached for five minutes, so the second read is nearly free.
 */

type Props = {
  /** Published posts as of the last build; absent in the Android export, where there is no build. */
  initialPosts?: BlogPostSummary[]
}

export async function getStaticProps() {
  if (isNativeMobile()) return {props: {}}

  try {
    const {posts} = await typedAPICall('get-blog-posts', {}, null)
    return {props: {initialPosts: posts}, revalidate: 60}
  } catch (e) {
    // Never fail the build over the blog. An API that is down at deploy time would otherwise take
    // the whole site with it, to save one page a round trip.
    console.error('Failed to prefetch blog posts', e)
    return {props: {}, revalidate: 60}
  }
}

export default function BlogIndexPage({initialPosts}: Props) {
  const t = useT()
  const {data} = useAPIGetter('get-blog-posts', {})

  const posts = data?.posts ?? initialPosts ?? []
  const loading = !data && !initialPosts

  return (
    <PageBase>
      <SEO
        title={t('blog.seo.title', 'Blog')}
        description={t(
          'blog.seo.description',
          'Writing from the people building Compass: what we are learning about how people actually meet, and the decisions behind how this platform works.',
        )}
        url="/blog"
      />

      <Col className="mx-auto w-full max-w-3xl gap-10 px-4 py-10 sm:py-14">
        <Col className="gap-4">
          <p className={clsx(eyebrow, 'text-primary-600')}>
            {t('blog.hero.eyebrow', 'From the team')}
          </p>
          <h1 className="text-ink-900 text-[clamp(30px,5vw,44px)] font-bold leading-[1.1] tracking-tight">
            {t('blog.hero.title', 'The Compass blog')}
          </h1>
          <p className="text-ink-600 max-w-xl text-lg leading-relaxed">
            {t(
              'blog.hero.subtitle',
              'What we are learning about how people find meaningful connections, and the reasoning behind how this platform works.',
            )}
          </p>
        </Col>

        {loading ? (
          <ListSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState />
        ) : (
          // Two up from `md` and not before: the sidebar only disappears below `lg`, so a second
          // column at `sm` would be two ~290px cards with a cropped cover and a two-word line length
          // in each. The stagger walks across the grid in reading order, which is the order the
          // cards are in.
          <div className="grid gap-5 md:grid-cols-2">
            {posts.map((post, i) => (
              <Reveal key={post.id} className="h-full" delay={Math.min(i, 4) * 60}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        )}
      </Col>
    </PageBase>
  )
}

/**
 * One post on the index.
 *
 * The whole card is the link rather than just the title, because a card with a small link in it is a
 * card most people will click the dead part of.
 */
function PostCard({post}: {post: BlogPostSummary}) {
  const t = useT()
  const date = formatBlogDate(post.publishedTime)

  return (
    <Link
      href={`/blog/${post.slug}`}
      // `flex-col` + `h-full` so two cards sharing a grid row are the same height whatever their
      // excerpts run to, and `flex-1` on the body below pins the byline to the bottom of both
      // rather than leaving one floating mid-card.
      className={clsx(surface, surfaceHover, 'flex h-full flex-col overflow-hidden')}
    >
      {post.coverImageUrl && (
        // A plain `<img>`, not `next/image`. The cover URL is typed by an admin and may point
        // anywhere, and `next/image` throws for any host missing from `remotePatterns` in
        // `next.config.ts` — which would turn "pasted a link from somewhere new" into a page that
        // does not render at all.
        //
        // Landscape, held by an aspect ratio rather than by a fixed height: the box then scales
        // with the card across breakpoints instead of getting proportionally taller as the column
        // narrows, and it reserves its space before the image loads either way, so there is no
        // layout shift. `object-cover` crops whatever the admin pasted to fit rather than letting a
        // tall or panoramic source dictate the card's height.
        <img
          src={post.coverImageUrl}
          alt=""
          loading="lazy"
          className="aspect-[6/4] w-full object-cover"
        />
      )}
      <Col className="flex-1 gap-2 p-6">
        <h2 className="text-ink-900 text-xl font-semibold leading-snug sm:text-2xl">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-ink-600 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        )}
        <Row className="text-ink-500 mt-auto pt-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {post.author && (
            <>
              <Avatar
                username={post.author.username}
                avatarUrl={post.author.avatarUrl ?? undefined}
                size="xs"
                noLink
              />
              <span>{post.author.name}</span>
              <span aria-hidden>·</span>
            </>
          )}
          {date && (
            <>
              <time dateTime={post.publishedTime ?? undefined}>{date}</time>
              <span aria-hidden>·</span>
            </>
          )}
          <span>
            {t('blog.reading_time', '{minutes} min read', {minutes: post.readingMinutes})}
          </span>
        </Row>
      </Col>
    </Link>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={clsx(surface, 'animate-pulse p-6')}>
          <div className="bg-canvas-200 h-5 w-2/3 rounded" />
          <div className="mt-4 space-y-2.5">
            <div className="bg-canvas-100 h-3 w-full rounded" />
            <div className="bg-canvas-100 h-3 w-11/12 rounded" />
          </div>
          <div className="bg-canvas-100 mt-5 h-3 w-40 rounded" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  const t = useT()
  return (
    <Col className={clsx(surface, 'items-center gap-3 px-6 py-16 text-center')}>
      <div className="text-ink-900 text-xl font-semibold">
        {t('blog.empty.title', 'Nothing published yet')}
      </div>
      <p className="text-ink-500 max-w-md text-sm leading-relaxed">
        {t('blog.empty.body', 'The first post is being written. Check back shortly.')}
      </p>
    </Col>
  )
}
