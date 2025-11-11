import {DEPLOYED_WEB_URL} from "common/envs/constants";

const buildIdKey = 'vercel-buildId';

export const getBuildId = async () => {
  const res = await fetch(`${DEPLOYED_WEB_URL}/api/build-id`)
  if (!res.ok) throw new Error('Failed to fetch build manifest')
  const data = await res.json()
  const buildId = data.buildId;
  if (!buildId) throw new Error('No buildId found in build manifest')
  localStorage.setItem(buildIdKey, buildId)
  return buildId
}

export const getPageData = async (route = '/') => {
  async function pull(buildId: string | undefined | null) {
    if (!buildId) {
      throw new Error('No buildId found')
    }
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route
    const url = `${DEPLOYED_WEB_URL}/api/proxy-data?path=${buildId}/${cleanRoute || 'index'}.json`
    console.log('Fetching data from:', url)
    const res = await fetch(url, {
      cache: 'force-cache',
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch data for ${route}: ${res.status} ${res.statusText}`)
    }
    return res
  }

  let buildId = localStorage.getItem(buildIdKey)
  if (!buildId) buildId = await getBuildId()

  let res: Response
  try {
    res = await pull(buildId)
  } catch (error: any) {
    if (error?.message?.includes('404')) {
      console.error('Build ID outdated, loading new one:', error.message)
      buildId = await getBuildId()
      res = await pull(buildId)
    } else {
      throw error
    }
  }

  const result = await res.json()
  console.log('Fetched Page data:', result)
  return result.pageProps
}