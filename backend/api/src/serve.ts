import 'tsconfig-paths/register'

import * as Sentry from '@sentry/node'
import {IS_LOCAL, SENTRY_DSN} from 'common/hosting/constants'
import {loadSecretsToEnv} from 'common/secrets'
import {ErrorRequestHandler} from 'express'
import * as admin from 'firebase-admin'
import {getServiceAccountCredentials} from 'shared/firebase-utils'
import {initAdmin} from 'shared/init-admin'
import {METRIC_WRITER} from 'shared/monitoring/metric-writer'
import {log} from 'shared/utils'
import {listen as webSocketListen} from 'shared/websockets/server'

import {app} from './app'

log('Api server starting up....')

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enableLogs: process.env.NODE_ENV === 'production',
})

const sentryErrorFilter: ErrorRequestHandler = (err, req, _res, next) => {
  const status = err.status ?? err.httpStatus ?? 500
  if (status >= 500) {
    Sentry.captureException(err, {
      extra: {path: req.path, method: req.method, status},
    })
  }
  next(err)
}

app.use(sentryErrorFilter)
app.use(Sentry.expressErrorHandler())

if (IS_LOCAL) {
  initAdmin()
} else {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT
  admin.initializeApp({
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  })
}

METRIC_WRITER.start()

const credentials = IS_LOCAL
  ? getServiceAccountCredentials()
  : // No explicit credentials needed for deployed service.
    undefined

const startupProcess = async () => {
  await loadSecretsToEnv(credentials)
  log('Secrets loaded.')

  const PORT = process.env.PORT ?? 8088
  const httpServer = app.listen(PORT, () => {
    log.info(`Serving API on port ${PORT}.`)
  })

  webSocketListen(httpServer, '/ws')
}
startupProcess().then((_r) => log('Server started successfully'))
