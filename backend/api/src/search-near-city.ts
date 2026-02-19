import {APIHandler} from './helpers/endpoint'
import {geodbFetch} from 'common/geodb'

const searchNearCityMain = async (cityId: string, radius: number) => {
  const endpoint = `/cities/${cityId}/nearbyCities?radius=${radius}&offset=0&sort=-population&limit=100`
  return await geodbFetch(endpoint)
}

export const searchNearCity: APIHandler<'search-near-city'> = async (body) => {
  const {cityId, radius} = body
  return await searchNearCityMain(cityId, radius)
}

export const getNearbyCities = async (cityId: string, radius: number) => {
  const result = await searchNearCityMain(cityId, radius)
  const cityIds = (result.data.data as any[]).map((city) => city.id.toString() as string)
  return cityIds
}
