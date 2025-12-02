import * as admin from 'firebase-admin'
import { getServiceAccountCredentials } from "shared/firebase-utils";
import { IS_LOCAL } from "common/hosting/constants";

export const initAdmin = () => {

  if (IS_LOCAL && process.env.USE_FIREBASE_EMULATOR === "true") {
    console.log("Using Firebase Emulator Suite.")

    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199" // Default Storage port

    return admin.initializeApp({
      projectId: "compass-57c3c",
      storageBucket: "compass-130ba-public",
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