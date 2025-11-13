import { DEV_CONFIG } from '../../../common/src/envs/dev';  

const FIREBASE_API_KEY = DEV_CONFIG.firebaseConfig.apiKey;

export const config = {
  BASE_URL: 'http://localhost:3000',
  DEFAULT_LOGIN: 'defaultUser@dev.com',
  DEFAULT_PASSWORD: 'defaultPassword',
  FIREBASE_AUTH_URL: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
};