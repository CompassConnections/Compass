# F-Droid publishing

Can Compass be published on the official [F-Droid](https://f-droid.org/) repo? **Not as built today, but
the gap is a build variant, not a backend migration.** Nothing has to move off Firebase.

Status: plan only. None of the changes below are implemented.

## Why a submission would fail today

F-Droid builds every app from source and its scanner fails the build on any non-free library. The
Android shell links several, all Google's:

| Where                                               | Library                                                                     | Used for                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `android/app/build.gradle`                          | `com.google.android.play:app-update`, `app-update-ktx`                      | In-app update prompt in `MainActivity.java`          |
| `android/app/build.gradle`                          | `firebase-bom`, `firebase-analytics`, `firebase-auth`, `play-services-auth` | Nothing in our own Java code — see step 1            |
| `android/build.gradle` + `android/app/build.gradle` | `com.google.gms:google-services` plugin                                     | Reads `google-services.json` for FCM                 |
| `@capacitor/push-notifications`                     | `com.google.firebase:firebase-messaging`                                    | Push (`web/lib/service/native-push.ts`)              |
| `@capacitor-community/in-app-review`                | `com.google.android.play:review`                                            | Store review card (`web/hooks/use-review-prompt.ts`) |
| `@capgo/capacitor-social-login`                     | `play-services-auth`, `credentials-play-services-auth`, `googleid`          | Native Google sign-in (`googleNativeLogin`)          |

## What is _not_ a blocker

- **License** — AGPL-3.0 + MIT, both accepted.
- **The Firebase JS SDK** (`firebase` in `web/package.json`) — Apache-2.0. Auth and storage run entirely
  through it in the WebView, so they need no proprietary native library. Email/password sign-in works
  in a Google-free build as is.
- **Firebase as a service** — talking to a proprietary backend earns the `NonFreeNet` anti-feature
  label, not a rejection. Moving auth and storage to Supabase would only remove that label; it fixes
  none of the rows above.
- **PostHog** — open source and already gated on consent (`web/lib/consent.ts`).
- **`gradle-wrapper.jar`** in git — F-Droid ignores it and uses its own Gradle.

## Minimal change

One F-Droid build variant that leaves the Google libraries out. The Play build stays exactly as it is.

1. **Delete the unused native dependencies** — for both builds. `MainActivity.java` is the only Java
   file and imports nothing from Firebase or `play-services-auth`; the plugins declare their own
   copies of what they need. Removing `firebase-bom`, `firebase-analytics`, `firebase-auth` and
   `play-services-auth` from `android/app/build.gradle` should change nothing. Verify on a device that
   Google sign-in and push still work in the Play build.

2. **Leave three plugins out at sync time.** `capacitor.build.gradle` is generated from `includePlugins`
   in `capacitor.config.ts`, so that list is the switch: behind an env var (say `FDROID=1`), omit
   `@capacitor/push-notifications`, `@capacitor-community/in-app-review` and
   `@capgo/capacitor-social-login`. With no plugin there is no Google library.

3. **Split the Google-touching Java out of `MainActivity`.** Add `play` and `fdroid` product flavors
   and move the in-app-update code and the `ModifiedMainActivityForSocialLoginPlugin` /
   `onActivityResult` hook into a helper that exists in `src/play/java` and is a no-op in
   `src/fdroid/java`. Put the `app-update` dependencies under `playImplementation`, and apply the
   `google-services` plugin only for `play`. F-Droid delivers updates itself, so nothing is lost.

4. **Gate the three features in the web bundle** behind the same flag (`NEXT_PUBLIC_FDROID`, set by the
   build script alongside `NEXT_PUBLIC_WEBVIEW`):
   - **Push** — skip `NativePush`. The F-Droid build gets no push notifications; email and in-app
     notifications still work.
   - **Review prompt** — skip it. There is no store review on F-Droid.
   - **Google sign-in** — hide the button; email/password remains. People who signed up with Google can
     set a password through the reset email.

5. **Make the build runnable without our CI secrets.** `cd-android.yml` passes
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_SUPABASE_KEY` and `MEDIA_SOURCE_BASE_URL` from GitHub
   secrets/vars. All three end up in the shipped bundle, so they are not secret, but F-Droid's builder
   has to get them from the repo or the recipe. `google-services.json` and the keystore are not needed.

6. **Add store metadata** under `fastlane/metadata/android/en-US/` (title, short and full description,
   icon, screenshots, `changelogs/<versionCode>.txt`). F-Droid reads it straight from the repo.

7. **Open a merge request on [fdroiddata](https://gitlab.com/fdroid/fdroiddata)** with
   `metadata/com.compassconnections.app.yml`: yarn install, the web build, `cap sync android`, then
   `assembleFdroidRelease`. Releases are already tagged (`1.48.0`), which is what F-Droid's update
   checker follows.

Steps 1–4 are the code change — a few days. Review on fdroiddata is done by volunteers and typically
takes weeks.

## What the listing would carry

- **`NonFreeNet`** — because sign-in and media depend on Firebase.
- **`Tracking`**, probably — Sentry error reporting is on by default (`web/instrumentation-client.ts`);
  only session replay waits for consent. Turning Sentry off in the F-Droid build, or putting it behind
  the consent banner, avoids the label.

## Open questions to settle before submitting

- **Signing.** F-Droid signs with its own key by default, so the F-Droid and Play builds of
  `com.compassconnections.app` cannot update each other — switching stores means uninstalling.
  Reproducible builds would let F-Droid ship our signature; that is extra work and not needed to be
  listed.
- **Media fetched at build time** (`web/scripts/fetch-media.mjs`, `MEDIA_SOURCE_BASE_URL`). Reviewers
  may ask for assets to come from the source repo rather than a download.
- **Remote resources in the WebView** — Google Fonts in `web/pages/_document.tsx` and the Google One Tap
  script in `web/lib/firebase/google-onetap-login.tsx`. Not scanner failures, but reviewers may ask;
  One Tap should be off in the F-Droid build regardless.
- **Prebuilt binaries pulled in by `yarn install`** (swc, sharp, the Sentry CLI). Other Capacitor apps
  are listed with the same toolchain, but the Sentry source-map upload in `web/next.config.ts` should
  be disabled for this build.

## Later, to close the feature gap

- **Google sign-in** through the system browser instead of the Google SDK — the flow that
  `webviewGoogleSignin` in `web/lib/firebase/users.ts` used before the native plugin replaced it.
- **Push** through [UnifiedPush](https://unifiedpush.org/), which needs a second delivery path in the
  API next to FCM.
- **Moving auth and storage to Supabase** — drops `NonFreeNet` and makes the stack self-hostable. A
  large migration (user IDs, password hashes, every stored image URL), and not required to be listed.

## Alternative: self-hosted F-Droid repo

`fdroidserver` can serve the existing signed APK, Google libraries and all, from our own repo URL — the
bans are policy of the official repo, not of the tooling. Users add the repo by hand and get updates
through the F-Droid client. Roughly an afternoon, but no discoverability in the main catalogue.
