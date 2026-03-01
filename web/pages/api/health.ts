import type {NextApiRequest, NextApiResponse} from 'next'

type HealthResponse = {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    uptime: process.uptime(),
  })
}
