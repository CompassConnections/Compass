import * as admin from 'firebase-admin'

import { getServiceAccountCredentials } from 'common/secrets'

export const getLocalEnv = () => {
  return (process.env.ENV?.toUpperCase() ?? 'STAGING') as 'PROD' | 'DEV'
}

// Locally initialize Firebase Admin.
export const initAdmin = () => {
  try {
    const env = getLocalEnv()
    const serviceAccount = getServiceAccountCredentials(env)
    console.log(
      `Initializing connection to ${serviceAccount.project_id} Firebase...`
    )
    return admin.initializeApp({
      projectId: serviceAccount.project_id,
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    })
  } catch (err) {
    console.error(err)
    console.log(`Initializing connection to default Firebase...`)
    return admin.initializeApp()
  }
}
