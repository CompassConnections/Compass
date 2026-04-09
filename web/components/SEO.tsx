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
}) {
  const {title, description, url, image, ogProps} = props

  const imageUrl =
    image ?? (ogProps && buildOgUrl(removeUndefinedProps(ogProps.props) as any, ogProps.endpoint))

  const absUrl = DEPLOYED_WEB_URL + url

  return (
    <Head>
      <title>{`${title} | ${endTitle}`}</title>

      {/*OG tags (WhatsApp, Facebook, etc.)*/}
      <meta property="og:title" content={title} key="title" />
      <meta property="og:description" content={description} key="description3" />

      {/*Twitter/X tags — separate!*/}
      <meta name="twitter:title" content={title} key="title" />
      <meta name="twitter:description" content={description} key="description2" />

      <meta name="description" content={description} key="description1" />

      {url && <link rel="canonical" href={absUrl} />}

      {url && <meta property="og:url" content={absUrl} key="url" />}

      {url && (
        <meta name="apple-itunes-app" content={'app-id=6444136749, app-argument=' + absUrl} />
      )}

      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} key="image1" />
          <meta name="twitter:card" content="summary_large_image" key="card" />
          <meta name="twitter:image" content={imageUrl} key="image2" />
        </>
      )}
    </Head>
  )
}
