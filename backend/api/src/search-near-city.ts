import {APIHandler} from './helpers/endpoint'
import {geodbFetch} from "common/geodb";

const searchNearCityMain = async (cityId: string, radius: number) => {
  // Limit to 10 cities for now for free plan, was 100 before (may need to buy plan)
  const endpoint = `/cities/${cityId}/nearbyCities?radius=${radius}&offset=0&sort=-population&limit=10`
  return await geodbFetch(endpoint)
}

export const searchNearCity: APIHandler<'search-near-city'> = async (body) => {
  const {cityId, radius} = body
  return await searchNearCityMain(cityId, radius)
}

export const getNearbyCities = async (cityId: string, radius: number) => {
  const result = await searchNearCityMain(cityId, radius)
  const cityIds = (result.data.data as any[]).map(
    (city) => city.id.toString() as string
  )
  return cityIds
}
