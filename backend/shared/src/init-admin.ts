import * as admin from 'firebase-admin'


import {getServiceAccountCredentials} from "shared/firebase-utils";

// Locally initialize Firebase Admin.
export const initAdmin = () => {
  try {
    const serviceAccount = getServiceAccountCredentials()
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
