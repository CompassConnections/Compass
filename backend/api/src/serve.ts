import 'tsconfig-paths/register'
import * as admin from 'firebase-admin'
import {initAdmin} from 'shared/init-admin'
import {loadSecretsToEnv} from 'common/secrets'
import {log} from 'shared/utils'
import {IS_LOCAL} from 'common/hosting/constants'
import {METRIC_WRITER} from 'shared/monitoring/metric-writer'
import {listen as webSocketListen} from 'shared/websockets/server'
import {app} from './app'
import {getServiceAccountCredentials} from 'shared/firebase-utils'

log('Api server starting up....')

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
