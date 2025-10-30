import {APIError, APIHandler} from './helpers/endpoint'
import {GOOGLE_CLIENT_ID} from "common/constants";
import {REDIRECT_URI} from "common/envs/constants";

export const authGoogle: APIHandler<'auth-google'> = async (
  {code, codeVerifier},
  _auth
) => {
  console.log('Google Auth Codes:', code, codeVerifier)
  if (!code || !codeVerifier) return {success: false, result: {}}

  const body = {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code: code as string,
    code_verifier: codeVerifier as string,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  };
  console.log('Body:', body)
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(body),
  });

  const tokens = await tokenRes.json();
  if (tokens.error) {
    console.error('Google token error:', tokens);
    throw new APIError(400, 'Google token error: ' + JSON.stringify(tokens))
  }
  console.log('Google Tokens:', tokens);

  return {
    success: true,
    result: {tokens},
  }
}
