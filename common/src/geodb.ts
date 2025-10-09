
export const geodbHost = 'wft-geo-db.p.rapidapi.com'

export const geodbFetch = async (endpoint: string) => {
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
      throw new Error(`HTTP error! Status: ${res.status} ${await res.text()}`)
    }

    const data = await res.json()
    console.debug('geodbFetch', endpoint, data)
    return {status: 'success', data}
  } catch (error) {
    console.debug('geodbFetch', endpoint, error)
    return {status: 'failure', data: error}
  }
}