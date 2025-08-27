import { APIHandler } from './helpers/endpoint'

export const searchNearCity: APIHandler<'search-near-city'> = async (body) => {
  const { cityId, radius } = body
  return await searchNearCityMain(cityId, radius)
}

const searchNearCityMain = async (cityId: string, radius: number) => {
  const apiKey = process.env.GEODB_API_KEY

  if (!apiKey) {
    return { status: 'failure', data: 'Missing GEODB API key' }
  }
  const host = 'wft-geo-db.p.rapidapi.com'
  const baseUrl = `https://${host}/v1/geo`
  const url = `${baseUrl}/cities/${cityId}/nearbyCities?radius=${radius}&offset=0&sort=-population&limit=100`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host,
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`)
    }

    const data = await res.json()

    return { status: 'success', data: data }
  } catch (error) {
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
