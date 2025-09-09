import { APIHandler } from './helpers/endpoint'
import {geodbHost} from "common/constants";

export const searchLocation: APIHandler<'search-location'> = async (body) => {
  const { term, limit } = body
  const apiKey = process.env.GEODB_API_KEY

  if (!apiKey) {
    return { status: 'failure', data: 'Missing GEODB API key' }
  }
  const baseUrl = `https://${geodbHost}/v1/geo`
  const url = `${baseUrl}/cities?namePrefix=${term}&limit=${
    limit ?? 10
  }&offset=0&sort=-population`

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

    return { status: 'success', data: data }
  } catch (error: any) {
    console.log('failure', error)
    return { status: 'failure', data: error.message }
  }
}
