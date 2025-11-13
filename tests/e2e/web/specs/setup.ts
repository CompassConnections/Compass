import { test as base, expect } from '@playwright/test';
import path from 'path';
import { config } from '../TESTING_CONFIG';

/*
Preforms login by directly contacting firebase using credentials from TESTING_CONFIG file.
Saves the resulting authenticated session state to a JSON file for reuse in later tests.
This was done to decrease flakiness and to avoid re-logging in every test.
*/

const test = base;

test('API Signin test', async ({ browser }) => {
  const email = config.DEFAULT_LOGIN;
  const password = config.DEFAULT_PASSWORD;
  const authUrl = config.FIREBASE_AUTH_URL;
  const baseUrl =config.BASE_URL;

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) throw new Error(`Firebase login failed: ${response.statusText}`);

  const data = await response.json();
  const { idToken, refreshToken, localId } = data;

  console.log('Logged in as:', localId);

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseUrl);

  await page.evaluate(([token, refresh]) => {
    localStorage.setItem('firebase_id_token', token);
    localStorage.setItem('firebase_refresh_token', refresh);
  }, [idToken, refreshToken]);

  await context.storageState({
    path: path.resolve(__dirname, '..', '.auth', 'user.json'),
  });

  await context.close();
});
