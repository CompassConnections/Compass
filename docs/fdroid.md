# F-Droid publishing

Can Compass be published on [F-Droid](https://f-droid.org/)? Short version: **licensing allows it, but the
Google/Firebase dependencies block the official repo.**

## Eligibility

- **License** — ✅ AGPL-3.0 + MIT. Meets F-Droid's hard FOSS-license requirement.
- **Buildable from source** — feasible; it's a Capacitor WebView shell over the `web` build.
- **Backend** — ⚠️ the app wraps the hosted service (compassmeet.com, Supabase + Firebase). F-Droid tags
  this `NonFreeNet` ("depends on a non-free network service") regardless of the client code.

## Blocking dependencies

Proprietary Google libraries F-Droid's main repo bans. From `android/app/build.gradle`:

- `com.google.firebase:firebase-analytics` — proprietary **and** tracking; an outright anti-feature.
- `com.google.firebase:firebase-auth` — proprietary Google auth.
- `com.google.android.gms:play-services-auth` — proprietary Google Play Services.
- `com.google.android.play:app-update` / `app-update-ktx` — proprietary in-app-update lib.
- `com.google.gms.google-services` Gradle plugin + `google-services.json` — non-free build tooling/config.

From the web bundle (`web/package.json`):

- `firebase` (11.1.0) — proprietary JS SDK compiled into the WebView assets.
- `@capacitor/push-notifications` — wired to Firebase Cloud Messaging (FCM), which is proprietary.

## Paths to ship

**Official F-Droid repo** — significant work:

- Remove `firebase-analytics` (or swap for self-hosted Matomo/Plausible).
- Replace Firebase Auth with a Supabase-side / FOSS auth flow.
- Replace FCM push with **UnifiedPush** (the F-Droid-blessed push system) — the biggest lift.
- Drop the in-app-update lib (F-Droid handles updates).
- Remove `google-services.json` and the gms plugin.
- Add F-Droid metadata + a reproducible build recipe. A `NonFreeNet` label likely remains because the
  backend is a hosted service.

Estimate: days-to-weeks, dominated by the auth + push replacement.

**Self-hosted F-Droid repo** — easy:

- Use `fdroidserver` to host the existing signed APK/AAB at your own repo URL (Firebase and all). The
  anti-feature bans are official-repo _policy_, not enforced by the tooling. Users add the repo manually
  and get auto-updates; you skip Google's storefront. Setup is roughly an afternoon.
