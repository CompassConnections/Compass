import {DEPLOYED_WEB_URL} from "common/envs/constants";

export const getBuildId = async () => {
  const res = await fetch(`${DEPLOYED_WEB_URL}/api/build-id`)
  if (!res.ok) throw new Error('Failed to fetch build manifest')
  const data = await res.json()
  return data.buildId
}

export const getPageData = async (route = '/') => {
  const buildId = await getBuildId()
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route
  const url = `${DEPLOYED_WEB_URL}/api/proxy-data?path=${buildId}/${cleanRoute || 'index'}.json`
  console.log('Fetching data from:', url)
  const res = await fetch(url, {cache: 'force-cache'}) as any
  if (!res.ok) throw new Error(`Failed to fetch data for ${route}`)
  const result = await res.json() as any
  console.log('Fetched Page data:', result)
  return result.pageProps
}