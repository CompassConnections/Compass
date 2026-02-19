import {FIREBASE_CONFIG, IS_FIREBASE_EMULATOR} from 'common/envs/constants'
import {getApp, getApps, initializeApp} from 'firebase/app'
import {connectStorageEmulator, getStorage} from 'firebase/storage'

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG)

// Initialize storage with emulator support
export const storage = getStorage()
export const privateStorage = getStorage(
  app,
  'gs://' + FIREBASE_CONFIG.privateBucket
)

// Connect to storage emulator if in emulator mode
if (IS_FIREBASE_EMULATOR) {
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectStorageEmulator(privateStorage, '127.0.0.1', 9199)
}
