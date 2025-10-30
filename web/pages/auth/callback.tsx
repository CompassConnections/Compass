import {useEffect} from "react";

export default function GoogleAuthCallback() {
  useEffect(() => {
    async function fetchToken() {
      const params = new URLSearchParams(window.location.search);
      console.log('/auth/callback', params);
      const code = params.get('code');
      // const state = params.get('state');

      if (code) {
        console.log('/auth/callback code', code);
        // Send code back to the native app
        window.location.href = `com.compassmeet://auth?code=${encodeURIComponent(code)}}`;

        // const codeVerifier = localStorage.getItem('pkce_verifier');
        // const body = new URLSearchParams({
        //   client_id: GOOGLE_CLIENT_ID,
        //   code,
        //   code_verifier: codeVerifier!,
        //   redirect_uri: 'com.compassmeet://auth',
        //   grant_type: 'authorization_code',
        // });
        // console.log('Body:', body);
        // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        //   method: 'POST',
        //   headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        //   body: body,
        // });
        // const tokens = await tokenResponse.json();
        // console.log('Tokens:', tokens);

        // Send code back to the native app
        // const deepLink = `com.compassmeet://auth?tokens=${encodeURIComponent(tokens)}}`;
        // window.location.href = deepLink;

      } else {
        document.body.textContent = 'Missing code in redirect.';
      }
    }

    fetchToken()
  }, []);
}
