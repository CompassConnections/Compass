import {geodbFetch} from 'common/geodb'

import {APIHandler} from './helpers/endpoint'

export const searchLocation: APIHandler<'search-location'> = async (body) => {
  const {term, limit} = body
  const endpoint = `/cities?namePrefix=${term}&limit=${limit ?? 10}&offset=0&sort=-population`
  // const endpoint = `/countries?namePrefix=${term}&limit=${limit ?? 10}&offset=0`
  return await geodbFetch(endpoint)
}
