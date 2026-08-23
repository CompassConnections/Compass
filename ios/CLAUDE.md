# ios

Capacitor wrapper that loads the Next.js build into a WKWebView. Swift shell; the actual app is the
`web` build, synced in via `npx cap sync ios`.

See [README.md](README.md) for build, signing, TestFlight and debugging, and
[`../docs/ios.md`](../docs/ios.md) for the plan and the remaining manual steps. Cross-package context
is in the [root CLAUDE.md](../CLAUDE.md).

## What's here vs not here

- Native scaffolding (`App/`, `Podfile`, `Info.plist`, `App.entitlements`, `AppDelegate.swift`).
- The web bundle lives in `/web` — to refresh it:
  ```bash
  yarn build-sync-ios          # build-web-view + cap sync ios + icon generation
  ```
- `ios/App/App/public`, `GoogleService-Info.plist`, `Pods/` and every generated PNG are gitignored.

## Things that are easy to get wrong

- **The root view controller is `NextExportViewController`, not `CAPBridgeViewController`.** It exists
  solely to install `NextExportRouter`. Capacitor's stock router maps every extension-less path to
  `index.html`, so a hard navigation to `/someone` or `/blog/a-post` silently served the home page
  while `next/link` navigation worked — which looks like a crash, not a routing bug. Our export emits
  `[username].html`, `blog/[slug].html`, `vote/[id].html`, `alerts/[id].html` and
  `messages/[channelId].html`, and the router resolves onto those. Android is unaffected: its
  `WebViewLocalServer` already resolves `.html` itself. If you add a dynamic route, no change is
  needed — the router finds the bracketed file by scanning the directory.

- **The iOS web build runs on macOS, so `scripts/build_web_view.sh` must stay BSD-tool-safe.** It
  strips `getStaticProps`/`getStaticPaths` from the pages in `SSG_PAGES` so dynamic routes export as
  plain `[username].html` / `blog/[slug].html` templates. That rename used GNU sed's `\b`, which BSD
  sed on the `macos-15` runner ignores while exiting 0 — so on iOS only, Next kept treating those two
  as SSG routes and emitted no template, and every profile and blog link fell back to the home page.
  It now uses `perl` and asserts both that the rename took and that the templates exist. Android never
  saw it: that build runs on Ubuntu.

- **`packageClassList` must be in `App/App/capacitor.config.json`**, and `npx cap sync ios` does not
  put it there. `CapacitorBridge.registerPlugins()` decodes that file into a struct whose
  `packageClassList` is non-optional, so an absent key makes the decode throw, the bridge registers
  only its four built-ins, and *every* plugin call fails with `"X" plugin is not implemented on ios`
  — while the app still launches and renders normally. `scripts/ios_plugin_classlist.mjs` writes it
  and both sync scripts call it; it exits non-zero on an empty list rather than shipping a build
  where nothing native works.

- **Push is FCM, not raw APNs.** `AppDelegate.swift` hands the APNs token to FirebaseMessaging and
  posts the *FCM* token back on `.capacitorDidRegisterForRemoteNotifications`. Without that the JS
  side would save an APNs token that `sendPushToToken` (backend/shared/src/mobile.ts) cannot address.
- **The `apns` block in `sendPushToToken` is load-bearing.** Without it an iOS push is data-only:
  nothing is displayed and delivery is best-effort.
- **Versioning**: `CURRENT_PROJECT_VERSION` (= `versionCode`) must strictly increase per upload;
  `MARKETING_VERSION` (= `versionName`) should match `android/app/build.gradle`. Both live in
  `App/App.xcodeproj/project.pbxproj`, and bumping the first is what triggers the release workflow.
- **Placeholders that must be filled before shipping**: `IOS_GOOGLE_CLIENT_ID` in
  `common/src/constants.ts` plus its reversed twin in `Info.plist`, and `APPLE_TEAM_ID` in
  `web/public/.well-known/apple-app-site-association`.
- **Don't add a custom `scheme`** in `capacitor.config.ts`. The default `capacitor://localhost` is a
  secure origin, which `getUserMedia` (voice auto-fill) and `crypto.subtle` (the Sign-in-with-Apple
  nonce) both need.
- **Platform branching in web code** goes through `isIosApp()` / `isAndroidApp()` /
  `isNativeApp()` in `web/lib/util/webview.ts`. `isNativeApp()` is the default — the product is meant
  to look the same on both.

## Editing the Xcode project without Xcode

`project.pbxproj`, `Info.plist` and `*.entitlements` are all text and are fine to edit directly.
`npx cap sync ios` rewrites the `capacitor_pods` block of the `Podfile` and the `public/` folder, and
leaves everything else alone — hand-added pods below `capacitor_pods` survive.
