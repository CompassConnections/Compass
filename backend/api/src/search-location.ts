import {ValidatedAPIParams} from 'common/api/schema'
import {geodbFetch, normalizeCountry} from 'common/geodb'

import {APIHandler} from './helpers/endpoint'

export const searchLocationEndpoint: APIHandler<'search-location'> = async (body) => {
  return await searchLocation(body)
}

export async function searchLocation(body: ValidatedAPIParams<'search-location'>) {
  const {term, limit} = body
  // Encode the user-supplied term and force limit to a small integer so neither can inject
  // extra query parameters into the external GeoDB request (e.g. a term containing `&`).
  const namePrefix = encodeURIComponent(term)
  const safeLimit = Number.isFinite(limit) ? Math.trunc(limit as number) : 10
  const endpoint = `/cities?namePrefix=${namePrefix}&limit=${safeLimit}&offset=0&sort=-population`
  // const endpoint = `/countries?namePrefix=${term}&limit=${limit ?? 10}&offset=0`
  const result = await geodbFetch(endpoint)

  // GeoDB says "United States of America"; every profile written from a search result must hold the
  // one spelling we store, so normalize here rather than at each of the callers.
  const cities = result.data?.data
  if (Array.isArray(cities)) {
    for (const city of cities) {
      if (city?.country) city.country = normalizeCountry(city.country)
    }
  }

  return result
}
