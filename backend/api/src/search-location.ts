import {ValidatedAPIParams} from 'common/api/schema'
import {geodbFetch} from 'common/geodb'

import {APIHandler} from './helpers/endpoint'

export const searchLocationEndpoint: APIHandler<'search-location'> = async (body) => {
  return await searchLocation(body)
}

export async function searchLocation(body: ValidatedAPIParams<'search-location'>) {
  const {term, limit} = body
  const endpoint = `/cities?namePrefix=${term}&limit=${limit ?? 10}&offset=0&sort=-population`
  // const endpoint = `/countries?namePrefix=${term}&limit=${limit ?? 10}&offset=0`
  return await geodbFetch(endpoint)
}
