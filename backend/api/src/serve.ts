import 'tsconfig-paths/register'

import * as Sentry from '@sentry/node'
import {IS_LOCAL, SENTRY_DSN} from 'common/hosting/constants'
import {loadSecretsToEnv} from 'common/secrets'
import {ErrorRequestHandler} from 'express'
import * as admin from 'firebase-admin'
import {getServiceAccountCredentials} from 'shared/firebase-utils'
import {initAdmin} from 'shared/init-admin'
import {startVpnRangeRefresh} from 'shared/moderation/vpn-check'
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

// METRIC_WRITER.start()

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

  // Which prefixes a VPN network announces changes week to week, so the signup check reads live BGP
  // data rather than whatever was true when the image was built. Not awaited: the server is already
  // serving. Nothing is compiled into the build, so until the first load lands a signup loads what
  // it needs itself, within its own request — on Cloud Run this background work only gets CPU while
  // a request is in flight, which is why it cannot be relied on alone. See
  // shared/moderation/vpn-check.ts.
  startVpnRangeRefresh()
}
startupProcess().then((_r) => log('Server started successfully'))
