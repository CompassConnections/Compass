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

      {/*OG tags (WhatsApp, Facebook, etc.)*/}
      <meta property="og:title" content={fullTitle} key="og-title" />
      <meta property="og:description" content={description} key="og-description" />
      {url && <meta property="og:url" content={absUrl} key="og-url" />}
      {imageUrl && <meta property="og:image" content={imageUrl} key="og-image" />}

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
