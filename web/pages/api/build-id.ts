import path from 'path'
import fs from 'fs'

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    // Handle preflight
    res.status(200).end()
    return
  }

  const buildId = fs.readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim()
  res.setHeader('Cache-Control', 's-maxage=31536000, stale-while-revalidate')
  res.status(200).json({buildId})
}
