import {APIHandler} from './helpers/endpoint'
import {geodbFetch} from "common/geodb";

export const searchLocation: APIHandler<'search-location'> = async (body) => {
  const {term, limit} = body
  const endpoint = `/cities?namePrefix=${term}&limit=${limit ?? 10}&offset=0&sort=-population`
  return await geodbFetch(endpoint)
}
