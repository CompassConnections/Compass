import * as Sentry from '@sentry/nextjs'
import type {NextApiRequest, NextApiResponse} from 'next'

// Custom error class for Sentry testing
class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SentryExampleAPIError'
  }
}

type Response = {
  name: string
}

// A faulty API route to test Sentry's error monitoring
export default function handler(_req: NextApiRequest, _res: NextApiResponse<Response>) {
  Sentry.logger.info('Sentry example API called')
  throw new SentryExampleAPIError('This error is raised on the backend called by the example page.')
  // res.status(200).json({name: 'John Doe'})
}
