# android

Capacitor wrapper that loads the Next.js build into an Android WebView. Java/Kotlin shell; the actual app
is the `web` build, synced in via `npx cap sync android`.

See [README.md](README.md) for the full build, signing, Firebase, Play Store, and live-update flow.
Cross-package context is in the [root CLAUDE.md](../CLAUDE.md).

## What's here vs not here

- Native scaffolding (`app/`, `gradle/`, `build.gradle`, `AndroidManifest.xml`, signing keystore).
- The web bundle lives in `/web` — to refresh it in the APK, build the web view and sync:
  ```bash
  yarn build-web-view           # builds web for Android
  npx cap sync android          # copies into android/app/src/main/assets
  ```

## Two run modes

- **Local-asset mode (default)**: app ships with the synced web build and loads it from `assets/`. Fast,
  offline, App-Store-compliant. Use for releases.
- **Remote / dev mode**: app loads from `http://10.0.2.2:3000` (emulator) or your LAN IP (physical device)
  so changes to `/web` show up instantly. Enable with:
  ```bash
  export NEXT_PUBLIC_LOCAL_ANDROID=1
  export NEXT_PUBLIC_WEBVIEW_DEV_PHONE=1     # only when targeting a physical device
  yarn dev                                   # or `yarn prod`
  ```

## Common tasks

```bash
./gradlew clean
./gradlew assembleDebug                          # → app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease                        # signed release (needs keystore set up)
npx cap open android                             # open in Android Studio
```

Logs:

```bash
adb logcat | grep -E 'CompassApp|com.compassconnections.app|Capacitor'
# WebView console → chrome://inspect/#devices
```

## Releases

Push to `main` with a bumped `versionCode` in `app/build.gradle` triggers
[`.github/workflows/cd-android.yml`](../.github/workflows/cd-android.yml), which builds the signed AAB and
uploads to Play Console. Manual release: build a signed AAB in Android Studio and upload yourself. See
[README.md](README.md) for keystore + Play API setup.

## Live updates

Disabled as of early 2026 — free Capawesome plan capped at 100 MAU, no longer enough. Web changes ship via
the normal Play Store release. The `capawesome.json` and GitHub Action are still wired up if we re-enable.

## Caveats

- App package name is `com.compassconnections.app` — must match Firebase Android-app config and signing
  cert's SHA-1/SHA-256.
- After installing a new signing key you'll see `INSTALL_FAILED_UPDATE_INCOMPATIBLE` until the previous APK
  is uninstalled.
- Don't commit `local.properties`, the keystore, or `google-services.json` changes unintentionally.
