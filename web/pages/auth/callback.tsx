import {useEffect} from "react";

export default function GoogleAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    console.log('/auth/callback code', code);

    if (code) {
      // Send code back to native app
      const deepLink = `com.compassmeet://auth?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
      window.location.href = deepLink;
    } else {
      document.body.textContent = 'Missing code in redirect.';
    }
  }, []);
}
