import { APIHandler } from './helpers/endpoint'
import { geodbHost } from 'common/constants'

export const searchNearCity: APIHandler<'search-near-city'> = async (body) => {
  const { cityId, radius } = body
  return await searchNearCityMain(cityId, radius)
}

const searchNearCityMain = async (cityId: string, radius: number) => {
  const apiKey = process.env.GEODB_API_KEY

  if (!apiKey) {
    return { status: 'failure', data: 'Missing GEODB API key' }
  }
  const baseUrl = `https://${geodbHost}/v1/geo`
  // Limit to 10 cities for now for free plan, was 100 before (may need to buy plan)
  const url = `${baseUrl}/cities/${cityId}/nearbyCities?radius=${radius}&offset=0&sort=-population&limit=10`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': geodbHost,
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status} ${await res.text()}`)
    }

    const data = await res.json()
    console.log('searchNearCityMain', data)

    return { status: 'success', data: data }
  } catch (error) {
    console.log('failure', error)
    return { status: 'failure', data: error }
  }
}

export const getNearbyCities = async (cityId: string, radius: number) => {
  const result = await searchNearCityMain(cityId, radius)
  const cityIds = (result.data.data as any[]).map(
    (city) => city.id.toString() as string
  )
  return cityIds
}
