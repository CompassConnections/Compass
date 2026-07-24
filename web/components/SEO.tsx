import {DEPLOYED_WEB_URL, endTitle} from 'common/envs/constants'
import {removeUndefinedProps} from 'common/util/object'
import {buildOgUrl} from 'common/util/og'
import Head from 'next/head'

export function SEO<P extends Record<string, string | undefined>>(props: {
  title: string
  description: string
  url?: string
  ogProps?: {props: P; endpoint: string}
  image?: string
  /** Only needed for an image that is not a 1200×630 PNG card — see the note on the tags below. */
  imageType?: string
  imageWidth?: string
  imageHeight?: string
  imageAlt?: string
}) {
  const {title, description, url, image, ogProps} = props
  const {
    // The /api/og/* routes answer with PNG (that is what @vercel/og's ImageResponse emits) at the
    // 1.91:1 card size, and that is the only image any caller passes today.
    imageType = 'image/png',
    imageWidth = '1200',
    imageHeight = '630',
    imageAlt,
  } = props

  const imageUrl =
    image ?? (ogProps && buildOgUrl(removeUndefinedProps(ogProps.props) as any, ogProps.endpoint))

  const absUrl = DEPLOYED_WEB_URL + url

  const fullTitle = `${title} | ${endTitle}`

  return (
    <Head>
      <title>{fullTitle}</title>

      <meta name="description" content={description} key="description" />
      {url && <link rel="canonical" href={absUrl} key="canonical" />}
      {url && (
        <meta
          name="apple-itunes-app"
          content={'app-id=6444136749, app-argument=' + absUrl}
          key="apple-itunes-app"
        />
      )}

      {/*OG tags (WhatsApp, Facebook, etc.). Everything here overrides the site-wide defaults in
         _app.tsx via the shared `key`s.*/}
      <meta property="og:title" content={fullTitle} key="og-title" />
      <meta property="og:description" content={description} key="og-description" />
      {url && <meta property="og:url" content={absUrl} key="og-url" />}
      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} key="og-image" />
          <meta property="og:image:secure_url" content={imageUrl} key="og-image-secure-url" />
          {/*Every image reaching this component is a 1200×630 card, so the dimensions are safe to
             state — and stating them is what makes WhatsApp reliably pick the large layout. The
             type has to be restated as well: _app.tsx's default says JPEG (its card is a .jpg),
             and without this the two would disagree on pages that override the image.*/}
          <meta property="og:image:type" content={imageType} key="og-image-type" />
          <meta property="og:image:width" content={imageWidth} key="og-image-width" />
          <meta property="og:image:height" content={imageHeight} key="og-image-height" />
          <meta property="og:image:alt" content={imageAlt ?? title} key="og-image-alt" />
        </>
      )}

      {/*Twitter/X tags — separate!*/}
      <meta name="twitter:title" content={fullTitle} key="twitter-title" />
      <meta name="twitter:description" content={description} key="twitter-description" />
      {imageUrl && (
        <>
          <meta name="twitter:card" content="summary_large_image" key="twitter-card" />
          <meta name="twitter:image" content={imageUrl} key="twitter-image" />
        </>
      )}
    </Head>
  )
}
