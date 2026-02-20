import {test as base} from '@playwright/test';
import axios from 'axios';
import {config} from '../SPEC_CONFIG';

// const baseUrl = 'http://localhost:9099/identitytoolkit.googleapis.com/v1';

async function deleteUser(email: string, password: string) {
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
    // Skip deletion if user doesn't exist or other auth errors occur
    if (err.response?.status === 400 || err.response?.data?.error?.message?.includes('EMAIL_NOT_FOUND')) {
      return;
    }
    console.log(err);
  }
}

type CleanupFixtures = {
  cleanupUsers: void;
};

export const test = base.extend<CleanupFixtures>({
  cleanupUsers: [
    async ({}, use) => {
      // Run all tests first
      await use();

      //then delete users
      await deleteUser(config.USERS.SPEC.EMAIL, config.USERS.SPEC.PASSWORD);
    },
    { auto: true },
  ],
});
