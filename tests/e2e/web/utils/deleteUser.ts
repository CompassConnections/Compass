import axios from 'axios';
import { config } from '../SPEC_CONFIG';

export async function deleteUser(email: string, password: string) {
  try {
    const login = await axios.post(
      `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.SIGN_IN_PASSWORD}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );

    await axios.post(
      `${config.FIREBASE_URL.BASE}${config.FIREBASE_URL.DELETE}`,
      { idToken: login.data.idToken }
    );
  } catch (err: any) {
    console.log(err);
  }
};