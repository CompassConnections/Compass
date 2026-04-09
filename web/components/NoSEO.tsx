import {endTitle} from 'common/envs/constants'
import Head from 'next/head'

/** Exclude page from search results */
export function NoSEO(props: {title?: string}) {
  let title = props.title ? props.title + ' | ' : ''
  title += endTitle
  return (
    <Head>
      <title>{title}</title>
      <meta name="robots" content="noindex,follow" />
    </Head>
  )
}
