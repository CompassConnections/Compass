import * as admin from 'firebase-admin'
import {getLocalEnv, initAdmin} from 'shared/init-admin'
import {loadSecretsToEnv, getServiceAccountCredentials} from 'common/secrets'
import {log} from 'shared/utils'
import {LOCAL_DEV} from "common/envs/constants";
import {METRIC_WRITER} from 'shared/monitoring/metric-writer'
import {listen as webSocketListen} from 'shared/websockets/server'

log('Api server starting up....')

if (LOCAL_DEV) {
  initAdmin()
} else {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT
  admin.initializeApp({
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  })
}

METRIC_WRITER.start()

import {app} from './app'

const credentials = LOCAL_DEV
  ? getServiceAccountCredentials(getLocalEnv())
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
  log('Server started successfully')
}
startupProcess()
