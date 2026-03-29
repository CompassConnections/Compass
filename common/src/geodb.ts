import {debug} from 'common/logger'
import {ProfileRow} from 'common/profiles/profile'
import {sleep} from 'common/util/time'

export const geodbHost = 'wft-geo-db.p.rapidapi.com'

export const geodbFetch = async (
  endpoint: string,
): Promise<{status: 'success' | 'failure'; data: any}> => {
  const apiKey = process.env.GEODB_API_KEY
  if (!apiKey) {
    return {status: 'failure', data: 'Missing GEODB API key'}
  }
  const baseUrl = `https://${geodbHost}/v1/geo`
  const url = `${baseUrl}${endpoint}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': geodbHost,
      },
    })

    if (!res.ok) {
      if (res.status === 429) {
        debug('geodbFetch', endpoint, 'Rate limited')
        await sleep(1100)
        return geodbFetch(endpoint)
      }
      throw new Error(`HTTP error! Status: ${res.status} ${await res.text()}`)
    }

    const data = await res.json()
    debug('geodbFetch', endpoint, data)
    return {status: 'success', data}
  } catch (error) {
    debug('geodbFetch', endpoint, error)
    return {status: 'failure', data: error}
  }
}
export function getLocationText(
  profile: ProfileRow | undefined | null,
  prefix?: string | undefined | null,
) {
  if (!profile) return
  prefix = prefix ?? ''
  const city = profile[`${prefix}city` as keyof ProfileRow]
  const country = profile[`${prefix}country` as keyof ProfileRow]
  const regionCode = profile[`${prefix}region_code` as keyof ProfileRow]

  const stateOrCountry = country === 'United States of America' ? regionCode : country

  if (!city) {
    return null
  }

  return `${city}${stateOrCountry && ', '}${stateOrCountry}`
}
