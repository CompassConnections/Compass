import axios from 'axios';
import { config } from '../tests/e2e/web/SPEC_CONFIG.js';

async function createAuth() {
  // const base = 'http://localhost:9099/identitytoolkit.googleapis.com/v1';

  await axios.post(`${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGNUP}`, {
    email: config.USERS.DEV_1.EMAIL,
    password: config.USERS.DEV_1.PASSWORD,
    returnSecureToken: true
  });

  console.log('Auth created', config.USERS.DEV_1.EMAIL)

}
createAuth();
