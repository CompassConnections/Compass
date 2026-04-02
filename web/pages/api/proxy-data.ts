export default async function handler(req: any, res: any) {
  const {path} = req.query // e.g. "v4FoTtuyX_XwjC3aS2_Y6/Martin.json"
  const upstreamUrl = `https://www.compassmeet.com/_next/data/${path}`

  const upstream = await fetch(upstreamUrl)
  const body = await upstream.text()

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  res.status(upstream.status).send(body)
}
