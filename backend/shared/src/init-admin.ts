import * as admin from 'firebase-admin'


import {getServiceAccountCredentials} from "shared/firebase-utils";
import {IS_LOCAL} from "common/envs/constants";

// Locally initialize Firebase Admin.
export const initAdmin = () => {
  if (IS_LOCAL) {
    try {
      const serviceAccount = getServiceAccountCredentials()
      // console.log(serviceAccount)
      if (!serviceAccount.project_id) {
        console.log(`GOOGLE_APPLICATION_CREDENTIALS not set, skipping admin firebase init.`)
        return
      }
      console.log(`Initializing connection to ${serviceAccount.project_id} Firebase...`)
      return admin.initializeApp({
        projectId: serviceAccount.project_id,
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`,
      })
    } catch (err) {
      console.error(err)
    }
  }

  console.log(`Initializing connection to default Firebase...`)
  return admin.initializeApp()
}
