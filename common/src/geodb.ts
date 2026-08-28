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

/** The one spelling we store in `profiles.country` (and friends) for the US. */
export const UNITED_STATES = 'USA'

const usCountryNames = [
  'united states',
  'united states of america',
  'the united states',
  'the united states of america',
  'usa',
  'u.s.a.',
  'u.s.a',
  'us',
  'u.s.',
  'u.s',
  'america',
]

export const isUnitedStates = (country: unknown) =>
  typeof country === 'string' && usCountryNames.includes(country.trim().toLowerCase())

/**
 * Collapse every synonym of the US onto {@link UNITED_STATES}. Country strings reach us from GeoDB
 * ("United States of America"), from LLM extraction ("USA", "U.S.") and from members typing them by
 * hand, and anything that groups or filters by country (feed, stats, spotlights) only works if a
 * single spelling is stored. Other countries pass through untouched.
 */
export function normalizeCountry(country: string): string
export function normalizeCountry<T extends null | undefined>(country: T): T
export function normalizeCountry(country: string | null | undefined): string | null | undefined
export function normalizeCountry(country: string | null | undefined): string | null | undefined {
  return isUnitedStates(country) ? UNITED_STATES : country
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

  if (!city) {
    return null
  }

  // US cities share names across states, so the state code is what actually pins the location down.
  // GeoDB sometimes returns a numeric region code, which means nothing to a reader — drop those.
  const state =
    isUnitedStates(country) && typeof regionCode === 'string' && !/^\d+$/.test(regionCode)
      ? regionCode
      : null

  return [city, state, isUnitedStates(country) ? UNITED_STATES : country].filter(Boolean).join(', ')
}

export function getGoogleMapsUrl(locationText: string) {
  let text = locationText.split(', ').join('+')
  text = text.replace(' ', '+')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
}
