import clsx from 'clsx'
import {BlogPost, formatBlogDate} from 'common/blog/blog'
import {typedAPICall} from 'common/util/api'
import {GetStaticPropsContext} from 'next'
import Link from 'next/link'
import {useRouter} from 'next/router'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Avatar} from 'web/components/widgets/avatar'
import {Content} from 'web/components/widgets/editor'
import {eyebrow} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'
import {isNativeMobile} from 'web/lib/util/webview'

import Custom404 from '../404'

/**
 * One blog post.
 *
 * Statically generated with `fallback: 'blocking'` and no pre-built paths, the same arrangement as
 * `/[username]`: a post published five minutes ago renders on first request and is then cached,
 * without a deploy and without a build that grows with the blog.
 *
 * The client re-reads through `useAPIGetter` as well, which is what makes the page work at all in the
 * Android build. That build is a static export, which supports neither `fallback: 'blocking'` nor
 * anything else that runs per request — so `scripts/build_web_view.sh` strips the two exports below
 * for it, exactly as it does for `/[username]`, leaving a plain client-rendered page. Nothing here
 * runs at build time there: both `slug` and `post` arrive undefined and come from the router and the
 * API instead.
 */

type Props = {
  /** Absent in the Android export, where nothing ran at build time to supply it. */
  slug?: string
  /** Absent when the build could not reach the API, and always absent in the Android export. */
  post?: BlogPost | null
}

export const getStaticProps = async (props: GetStaticPropsContext<{slug: string}>) => {
  const {slug} = props.params!

  if (isNativeMobile()) return {props: {slug}}

  try {
    const {post} = await typedAPICall('get-blog-post', {slug}, null)
    return {
      props: {slug, post},
      // An unknown slug is revalidated aggressively: the most likely reason to be asking for one is
      // that it is about to exist, or has just been published and this render lost the race.
      revalidate: post ? 60 : 5,
    }
  } catch (e) {
    console.error('Failed to prefetch blog post', slug, e)
    return {props: {slug}, revalidate: 5}
  }
}

export const getStaticPaths = () => {
  // Nothing pre-built: posts are few and cheap to render on demand, and enumerating them here would
  // make every deploy depend on a database read that can only ever be out of date by the time the
  // build finishes.
  return {paths: [], fallback: 'blocking'}
}

export default function BlogPostPage({slug: staticSlug, post: initialPost}: Props) {
  const t = useT()
  const router = useRouter()

  // The URL, not the prop, is the source of truth for which post this is: in the Android export
  // there is no prop, and `router.query` is empty for one render either way before the router picks
  // the path apart. `undefined` props hold the fetch until then rather than asking the API for a
  // post called "undefined".
  const slug = staticSlug ?? (router.query.slug as string | undefined)
  const {data} = useAPIGetter('get-blog-post', slug ? {slug} : undefined)

  // `data ? data.post : initialPost`, not `data?.post ?? initialPost`. The client answer is allowed
  // to be `null` — that is the answer for a slug with no published post behind it — and `??` would
  // read that as "missing" and fall back to the build-time prop, which is `undefined` in the Android
  // export. The page would then sit on its skeleton forever instead of 404ing.
  const post = data ? data.post : initialPost

  // `undefined` is "still loading" and `null` is "there is no such post"; they must not collapse, or
  // every post flashes a 404 on the way in.
  if (post === undefined) return <PostSkeleton />
  if (post === null) return <Custom404 />

  const date = formatBlogDate(post.publishedTime)

  return (
    <PageBase>
      <SEO
        title={post.title}
        description={post.excerpt ?? t('blog.seo.description_fallback', 'From the Compass blog.')}
        url={`/blog/${post.slug}`}
        // The cover when there is one, so a shared post previews as itself rather than as the site
        // card. `SEO` states 1200×630 for it, which is a hint rather than a promise — every scraper
        // fetches the image and measures it — and the alternative is no preview image at all.
        image={post.coverImageUrl ?? undefined}
      />

      <Col className="mx-auto w-full max-w-3xl gap-8 px-4 py-10 sm:py-14">
        <Col className="gap-4">
          <Link
            href="/blog"
            className={clsx(eyebrow, 'text-primary-600 hover:text-primary-700 w-fit')}
          >
            {t('blog.back', '← All posts')}
          </Link>

          <h1 className="text-ink-900 text-[clamp(30px,5vw,46px)] font-bold leading-[1.1] tracking-tight">
            {post.title}
          </h1>

          {post.excerpt && <p className="text-ink-600 text-lg leading-relaxed">{post.excerpt}</p>}

          <Row className="text-ink-500 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {post.author && (
              <>
                <Avatar
                  username={post.author.username}
                  avatarUrl={post.author.avatarUrl ?? undefined}
                  size="xs"
                />
                <Link href={`/${post.author.username}`} className="hover:text-ink-700">
                  {post.author.name}
                </Link>
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

        {post.coverImageUrl && (
          // Plain `<img>` for the same reason as on the index: the URL is admin-typed and may point
          // at a host `next/image` has never been told about, and that is a thrown error rather than
          // a broken image.
          <img
            src={post.coverImageUrl}
            alt=""
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        )}

        {/* The same renderer the editor writes through, so what an admin sees while composing is
            what a reader gets. */}
        <Content content={post.content} size="lg" className="prose-p:!my-4" />

        <div className="border-canvas-200 border-t pt-6">
          <Link href="/blog" className="text-primary-600 text-sm hover:underline">
            {t('blog.back', '← All posts')}
          </Link>
        </div>
      </Col>
    </PageBase>
  )
}

function PostSkeleton() {
  return (
    <PageBase>
      <Col className="mx-auto w-full max-w-3xl gap-6 px-4 py-10 sm:py-14" aria-hidden>
        <div className="bg-canvas-200 h-10 w-3/4 animate-pulse rounded" />
        <div className="bg-canvas-100 h-4 w-40 animate-pulse rounded" />
        <Col className="mt-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={clsx(
                'bg-canvas-100 h-3 animate-pulse rounded',
                i % 3 === 2 ? 'w-4/5' : 'w-full',
              )}
            />
          ))}
        </Col>
      </Col>
    </PageBase>
  )
}
