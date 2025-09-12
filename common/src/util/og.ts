import {DOMAIN, LOCAL_DEV, LOCAL_WEB_URL} from 'common/envs/constants'

// opengraph functions that run in static props or client-side, but not in the edge (in image creation)

export function buildOgUrl<P extends Record<string, string>>(
  props: P,
  endpoint: string,
  domain?: string
) {
  const generateUrlParams = (params: P) =>
    new URLSearchParams(params).toString()

  return `https://${domain ?? LOCAL_DEV ? LOCAL_WEB_URL : DOMAIN}/api/og/${endpoint}?` + generateUrlParams(props)
}
