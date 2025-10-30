import {useEffect} from "react";

export default function GoogleAuthCallback() {
  useEffect(() => {
    async function fetchToken() {
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

    fetchToken()
  }, []);
}
