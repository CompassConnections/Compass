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

- **`ios.contentInset` is `never`, and must stay that way.** Safe areas are handled once, in CSS, by
  `env(safe-area-inset-*)` — the same model Android and the web use. With `always`, WKWebView shrinks
  the viewport by the bottom inset only as the scroll reaches the end (`innerHeight` 848 at the top of
  a page, 814 at the bottom on an iPhone) while the CSS keeps adding its own 34px, so the bottom nav
  lifted 68px off the screen edge with 34px of filler behind it and left a strip uncovered over the
  home indicator. It looked intermittent because it only appeared at the bottom of a scroll.

- **Firebase Auth must be created with `initializeAuth`, not `getAuth`, inside the native shells.**
  `getAuth` installs the default popup/redirect resolver, which loads `apis.google.com/js/api.js` and
  builds a gapi iframe at startup. gapi cannot parse a non-http origin, so on `capacitor://localhost`
  it throws `evaluating 'gapi.iframes.getContext'` and auth never initialises — `onIdTokenChanged`
  never fires, `useUser()` stays `undefined`, and `pages/index.tsx` shows its loading animation
  forever with no visible error. See `web/lib/firebase/users.ts`. Android is unaffected only because
  Capacitor serves it from `https://localhost`; iOS cannot copy that, since the `capacitor://` scheme
  is what makes the origin secure for `getUserMedia` and `crypto.subtle`.

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

## Debugging the WebView from Linux

`ios/scripts/webview-eval.mjs` evaluates JS in the phone's WebView over `ios_webkit_debug_proxy`,
without a browser — the fastest way to answer "what is the app actually seeing". Needs a build made
with `IOS_WEB_DEBUG=1`; a stock Release build is never inspectable. See [README.md](README.md) §5.

## Editing the Xcode project without Xcode

`project.pbxproj`, `Info.plist` and `*.entitlements` are all text and are fine to edit directly.
`npx cap sync ios` rewrites the `capacitor_pods` block of the `Podfile` and the `public/` folder, and
leaves everything else alone — hand-added pods below `capacitor_pods` survive.
