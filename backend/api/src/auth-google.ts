import {APIHandler} from './helpers/endpoint'
import {GOOGLE_CLIENT_ID} from "common/constants";

export const authGoogle: APIHandler<'auth-google'> = async (
  {code},
  _auth
) => {
  console.log('Google Auth Code:', code)
  if (!code) return {success: false, result: {}}

  const body = {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code: code as string,
    grant_type: 'authorization_code',
    redirect_uri: 'https://www.compassmeet.com/auth/callback',
  };
  console.log('Body:', body)
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(body),
  });

  const tokens = await tokenRes.json();
  console.log('Google Tokens:', tokens);

  return {
    success: true,
    result: {tokens},
  }
}
