import * as admin from 'firebase-admin'
import {getServiceAccountCredentials} from 'shared/firebase-utils'
import {IS_LOCAL} from 'common/hosting/constants'
import {IS_FIREBASE_EMULATOR} from 'common/envs/constants'

export const initAdmin = () => {
  if (IS_LOCAL && IS_FIREBASE_EMULATOR) {
    // console.log("Using Firebase Emulator Suite.")
    return admin.initializeApp({
      projectId: 'compass-57c3c',
      storageBucket: 'compass-130ba-public',
    })
  }

  if (IS_LOCAL) {
    try {
      const serviceAccount = getServiceAccountCredentials()

      if (!serviceAccount.project_id) {
        console.debug(`GOOGLE_APPLICATION_CREDENTIALS not set, skipping admin firebase init.`)
        return
      }
      console.debug(`Initializing connection to ${serviceAccount.project_id} Firebase...`)
      return admin.initializeApp({
        projectId: serviceAccount.project_id,
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`,
      })
    } catch (err) {
      console.error(err)
    }
  }

  console.debug(`Initializing connection to default Firebase...`)
  return admin.initializeApp()
}
