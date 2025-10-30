import {unauthedApi} from "common/util/api";
import {GoogleAuthProvider, signInWithCredential} from "firebase/auth";
import {auth} from "web/lib/firebase/users";

export async function fetchToken() {
  const params = new URLSearchParams(window.location.search);
  console.log('/auth/callback', params);
  const code = params.get('code');

  if (code) {
    // Send code back to the native app
    window.location.href = `com.compassmeet://auth?code=${encodeURIComponent(code)}}`;
  } else {
    document.body.textContent = 'Missing code in redirect.';
  }
}

export async function oauthRedirect(event: any) {
  console.log('Received oauthRedirect event:', event);
  const detail = event.data
  console.log('OAuth data:', detail);
  if (!detail) {
    console.error('No detail found in event');
    return;
  }
  const url = new URL(detail);

  const code = url.searchParams.get('code');
  if (!code) {
    console.error('No code found in URL');
    return;
  }

  try {
    const {result} = await unauthedApi('auth-google', {code})
    const googleTokens = result.tokens
    // console.log('/auth-google tokens', googleTokens);
    // Create a Firebase credential from the Google tokens
    const credential = GoogleAuthProvider.credential(googleTokens.id_token, googleTokens.access_token)
    // Sign in with Firebase using the credential
    const userCredential = await signInWithCredential(auth, credential)
    // console.log('Creds:', userCredential)
    // console.log('Firebase user:', userCredential.user)
    return userCredential
  } catch (e) {
    console.error('Error during OAuth flow:', e);
    return
  }
}