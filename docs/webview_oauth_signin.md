# WebView OAuth Sign-in

How to let a WebView-based app safely complete OAuth with PKCE, even though Google blocks sign-in *inside* WebViews.

---

## 1. The problem

Google OAuth refuses to complete inside a WebView.
You’ll get errors like:

```
403 disallowed_useragent
or
This browser or app may not be secure
```

This is because embedded WebViews can intercept credentials, and Google requires that the sign-in happen in a **real browser** (like Chrome, Safari, Firefox).

So we must:

1. Start the login **from inside** the WebView app.
2. Open the Google login page in the **system browser**.
3. After the user finishes signing in, Google redirects to a **custom URL** (deep link or universal link).
4. The app intercepts that redirect, extracts the `code` from it, and injects it back into the WebView.

That’s the “catch the redirect with a custom scheme or deep link” part.

---

## 2. What a deep link / custom scheme is

A **custom scheme** is a URL protocol that your app owns.
Example:

```
com.compassmeet://auth
```

or

```
compassmeet://auth
```

When Android (or iOS) sees a redirect to one of these URLs, it **launches your app** and passes it the URL data.

You register this scheme in your `AndroidManifest.xml` so Android knows which app handles it.

---

## 3. How it fits into PKCE

Let’s map the PKCE flow to this setup.

### Step 1 — Start PKCE flow inside the WebView

Your web code (running inside WebView) does:

```ts
const { codeVerifier, codeChallenge } = await generatePKCE();
localStorage.setItem('pkce_verifier', codeVerifier);

const params = new URLSearchParams({
  client_id: GOOGLE_CLIENT_ID,
  redirect_uri: 'com.compassmeet://auth',  // your deep link
  response_type: 'code',
  scope: 'openid email profile',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, '_system'); 
```

Here, `_system` (or using Capacitor Browser plugin) opens the **system browser**.

---

### Step 2 — User signs in (in the browser)

After login, Google redirects to your registered `redirect_uri`, e.g.:

```
com.compassmeet://auth?code=4/0AfJohXyZ...
```

---

### Step 3 — The app intercepts that deep link

In your **Android app code**, you register an intent filter in `AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="com.compassmeet" android:host="auth" />
</intent-filter>
```

Then, in your app’s main activity, you listen for deep links.
In java:
```java
@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);

    String data = intent.getDataString();
    if (data != null && data.startsWith("com.compassmeet://auth")) {
        bridge.triggerWindowJSEvent("oauthRedirect", data);
    }
}
```

Or in Kotlin:
```kotlin
override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val data = intent.dataString
    if (data != null && data.startsWith("com.compassmeet://auth")) {
        bridge.triggerWindowJSEvent("oauthRedirect", data)
    }
}
```

That line emits a custom JavaScript event inside the WebView so your web app can pick it up.

---

### Step 4 — WebView catches redirect event and exchanges the code

In your web app (TypeScript side):

```ts
window.addEventListener('oauthRedirect', async (event: any) => {
  const url = new URL(event.detail);
  const code = url.searchParams.get('code');
  const codeVerifier = localStorage.getItem('pkce_verifier');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      code,
      code_verifier: codeVerifier!,
      redirect_uri: 'com.compassmeet://auth',
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();
  console.log('Tokens:', tokens);
});
```

At this point:

* You have your `access_token` and `id_token`.
* You can sign into Firebase or use them directly.

---

## 4. Why this works and what makes it safe

* The login itself happens in Google’s **system browser**, not in your WebView.
* The `code_verifier` ensures that only your app (which generated the challenge) can exchange the code.
* The deep link ensures the token is delivered **only** to your app.
* No backend is required.

---

## 5. Universal links alternative

If you want to use a normal HTTPS redirect (e.g. `https://www.compassmeet.com/auth/callback`), you can register it as a **universal link**:

* User finishes login → redirected to your HTTPS domain.
* That URL is also registered to open your app (via Digital Asset Links JSON).
* Android recognizes it and launches your app instead of loading the page in the browser.
* The rest of the flow is the same.

However, universal links are more setup-heavy (require hosting a `.well-known/assetlinks.json` file).

---

## 6. Summary

| Step | What happens                                                   | Where          |
| ---- |----------------------------------------------------------------| -------------- |
| 1    | Generate PKCE challenge and open Google OAuth URL              | WebView        |
| 2    | User signs in                                                  | System browser |
| 3    | Browser redirects to deep link (e.g. `com.compassmeet://auth`) | OS → App       |
| 4    | App intercepts deep link and injects it into WebView           | Native layer   |
| 5    | WebView exchanges `code` for tokens via PKCE                   | Web app        |
