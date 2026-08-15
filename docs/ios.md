# Implementing the iOS app

Implementation notes for shipping Compass on iOS. Nothing here is built yet — this is the plan, written
against what the Android app ([`android/README.md`](../android/README.md),
[`android/CLAUDE.md`](../android/CLAUDE.md)) already does, so the work is framed as "what carries over"
vs. "what has no iOS equivalent yet".

The strategy is the same as Android: **Capacitor wrapper around the existing Next.js static export**. No
React Native, no second UI codebase. `web/` stays the single source of the product.

---

## 1. What already works, unchanged

These are not iOS work items — they're already platform-agnostic and will light up as soon as an iOS
target exists:

| Piece                                            | Where                                               |
| ------------------------------------------------ | --------------------------------------------------- |
| The whole UI                                     | `web/` — same static export as Android              |
| Static-export build (strips SSR/ISR/SSG)         | `scripts/build_web_view.sh`                         |
| Native-platform detection                        | `web/lib/util/webview.ts` (`isAndroidApp` — rename) |
| Safe-area insets (notch / home indicator)        | `web/styles/globals.css` `env(safe-area-inset-*)`   |
| Status-bar theming                               | `web/hooks/use-theme.ts` (`updateStatusBar`)        |
| Keyboard show/hide handling                      | `web/pages/_app.tsx` (`@capacitor/keyboard`)        |
| Native share sheet                               | `web/lib/util/share.ts` (`@capacitor/share`)        |
| Push registration + token save                   | `web/lib/service/android-push.ts` (rename)          |
| `save-subscription-mobile` endpoint + FCM tokens | `backend/api/src/save-subscription-mobile.ts`       |

The Capacitor plugins we already depend on (`@capacitor/app`, `keyboard`, `push-notifications`, `share`,
`status-bar`, `@capgo/capacitor-social-login`) all support iOS. Nothing needs replacing.

### Naming cleanup to do first

`isAndroidApp()`, `AndroidPush`, `android-push.ts` are all misnomers the moment iOS exists — they already
mean "native app". Rename to `isNativeApp()` / `NativePush` / `native-push.ts` before adding the platform,
and use `Capacitor.getPlatform()` (`'ios' | 'android' | 'web'`) wherever behaviour genuinely diverges.
`isNativeMobile()` in `web/lib/util/webview.ts` is already the right name and can stay.

---

## 2. Prerequisites (hard blockers)

- **macOS, but not necessarily a Mac you own.** Xcode is macOS-only and there is no supported way to build
  or sign an iOS app without it — but that macOS can be a `macos-latest` GitHub Actions runner (billed at
  10× Linux minutes) or a rented remote Mac. See [§2.1](#21-working-without-a-mac) — the whole
  build → sign → TestFlight loop is drivable from Linux/Windows.
- **Apple Developer Program membership** — $99/year. Not just for shipping: the Push Notifications and
  Sign in with Apple **entitlements are unavailable on a free account**, so the two features that make
  this more than a wrapped website can't even be built without it.
- **A physical iPhone** — see below. The Simulator is not sufficient.
- Xcode 16+, CocoaPods (`sudo gem install cocoapods`), Node 22+, Java is _not_ needed.

### Test device

Buy one. The Simulator can inject a local `.apns` payload into a running app, which validates our tap
handler, but it **cannot obtain a real APNs device token**, so it can't exercise the part we actually need
to trust: `PushNotifications.register()` → token → `save-subscription-mobile` → `sendPushToToken` →
delivery. Everything in §6 is untestable without hardware.

Hardware specs are close to irrelevant here — the app is a WKWebView, and the push plugin needs no Face ID,
no Dynamic Island, no particular chip. Two things about the device do matter:

- **It must have a notch or Dynamic Island.** Content sitting under the status bar is the single most
  common layout bug in a webview app, and our layout leans hard on `env(safe-area-inset-*)`
  (`web/styles/globals.css`, `bottom-nav-bar.tsx`, `filters.tsx`, `search.tsx`, `media-modal.tsx`). A
  device without one gives a bottom inset of `0px` and never surfaces those bugs.
- **It must run a current iOS**, so the permission dialogs and APNs behaviour match what users see.

**Recommendation: a refurbished iPhone 12 or 13, ~$150–250.** Notch, current iOS, cheap. That's the whole
requirement.

**Avoid the iPhone SE (2nd/3rd gen)** even though it's often the cheapest option — Home-button body, no
notch, smaller screen. It would miss exactly the class of bug the device is being bought to catch, to save
$50–100. False economy.

Dynamic Island phones (14 Pro and later) have slightly larger top insets than notched ones, but since
everything is driven by `env()` rather than hardcoded values, a notched device is a fine proxy. Check the
top of the profile page and the filter sheet on whatever you get.

### 2.1 Working without a Mac

We develop on Linux and Windows. Buying a Mac is not a prerequisite — the plan below assumes a physical
iPhone (above) plus cloud/rented macOS for the steps that genuinely need Xcode.

**Build and ship from CI.** The `macos-latest` runner in §7 does `npx cap sync ios`, CocoaPods, `xcodebuild`,
fastlane `match` (certs/profiles) and `pilot` (TestFlight upload). Triggering it is just pushing a commit and
setting secrets, so the whole release path is Mac-free. Install builds on the iPhone over the air via the
**TestFlight app** — no cable, no Xcode, and the resulting build is a real signed one, so the APNs work in §6
is testable.

**Everything in `web/` is normal work.** `Info.plist`, `*.entitlements`, `capacitor.config.ts` and even
`project.pbxproj` are text; editing them in a normal editor is fine. Xcode's GUI is a convenience for the
capability toggles, not a requirement.

**On-device debugging over USB works from Linux.** This is the part that is usually assumed to need a Mac and
doesn't:

| Need                           | Linux tool                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- |
| Pair / list devices, read UDID | `libimobiledevice` (`idevice_id -l`, `ideviceinfo`)                        |
| Install an ad-hoc `.ipa`       | `ideviceinstaller`                                                         |
| Native + Capacitor plugin logs | `idevicesyslog` (system log; does **not** include WKWebView `console.log`) |
| **JS console / DOM / network** | `ios-webkit-debug-proxy` → `chrome://inspect`                              |
| Retrieve native crash reports  | `idevicecrashreport`                                                       |

`ios-webkit-debug-proxy` is the important one: enable Settings → Safari → Advanced → Web Inspector on the
phone, run the proxy over USB, and attach Chrome DevTools to the WKWebView. That is functionally Safari's
Web Inspector — JS console, DOM, network — which matters a lot for a webview app. It is a community project
and can be picky about iOS/tool version pairings, so budget some setup time.

**What still needs a real interactive macOS session:**

- First-time Apple Developer setup done through Xcode's UI — Associated Domains (§4.1), Sign in with Apple
  (§5), push entitlement (§6), `fastlane match init`. All scriptable/hand-editable, but error-prone blind;
  expect to burn CI cycles on provisioning-profile mismatches Xcode would have shown visually.
- The first App Store Connect submission and its metadata (§7).
- **Crash symbolication** — turning a `.ips` from `idevicecrashreport` into a readable stack trace needs the
  `.dSYM` and Xcode's `symbolicatecrash`. Do it on the CI runner as a step, or on a rented Mac.

**Getting that macOS time.** AWS EC2 Mac (`mac2.metal`) gives a full GUI machine but bills a **24-hour
minimum dedicated-host allocation** — wrong shape for a 20-minute Xcode session. A monthly Mac mini rental
(MacStadium, Scaleway, ~$25–50/mo) is the better fit for occasional interactive use. Recommendation: CI for
the pipeline, a short rental for the one-time setup and submission, cable + `iwdp` for day-to-day.

---

## 3. Scaffolding the platform

```bash
yarn --cwd=web add -D @capacitor/ios
npx cap add ios          # creates ios/App/… at the repo root, alongside android/
yarn build-web-view
npx cap sync ios
npx cap open ios         # opens ios/App/App.xcworkspace in Xcode
```

`capacitor.config.ts` at the repo root is shared — `appId`, `appName`, `webDir: 'web/out'` and
`includePlugins` all apply to both platforms as-is. Two things to add:

```ts
ios: {
  contentInset: 'always',        // avoids WKWebView double-insetting under the notch
  scheme: 'Compass',             // app is served from capacitor://; see §6 on cookies/CORS
},
```

The dev-server override (`server: {url: 'http://10.0.2.2:3000', cleartext: true}`) is Android-specific:
`10.0.2.2` is the Android emulator's alias for the host. The iOS Simulator shares the host's network, so it
should use `localhost:3000`; a physical iPhone needs the LAN IP, same as
`NEXT_PUBLIC_WEBVIEW_DEV_PHONE=1` already does. Branch on `process.env.CAP_PLATFORM` or just add an
`ios.url` when we wire this up. Cleartext HTTP also needs an ATS exception in `Info.plist`
(`NSAllowsLocalNetworking`) — **debug configuration only**, App Review rejects a blanket
`NSAllowsArbitraryLoads`.

Also register the repo-root `ios/` directory in `.gitignore` carefully: commit `ios/App/App.xcodeproj`,
`Info.plist`, and the source, but ignore `ios/App/Pods/` and `ios/App/build/` (mirror what
`android/.gitignore` does).

---

## 4. Native code with no iOS equivalent yet

`android/app/src/main/java/com/compassconnections/app/MainActivity.java` has grown four hand-written
native features. Each needs a decision on iOS:

### 4.1 Deep-link bridge (`handleAppLink`)

Android stashes the launch `Intent` URL in `pendingDeepLink`, exposes it over a
`@JavascriptInterface` (`window.AndroidBridge.getPendingDeepLink()`), and pushes later links in by calling
`evaluateJavascript("handleAppLink(...)")` from `onNewIntent`. `web/pages/_app.tsx:198-209` consumes both
paths.

On iOS **don't reimplement the bridge** — `@capacitor/app` already gives you this cross-platform:

```ts
App.addListener('appUrlOpen', ({url}) => handleAppLink({endpoint: new URL(url).pathname}))
const launch = await App.getLaunchUrl() // replaces getPendingDeepLink()
```

Ideally migrate Android onto the same listener afterwards and delete the `AndroidBridge` deep-link half.

Universal Links (the iOS equivalent of the `autoVerify` intent filter for `compassmeet.com`) need:

- the **Associated Domains** capability with `applinks:compassmeet.com` and `applinks:www.compassmeet.com`,
- an `apple-app-site-association` JSON file served from `https://compassmeet.com/.well-known/`, no
  redirect, `Content-Type: application/json`. Add it to `web/public/.well-known/` and confirm the Vercel
  config doesn't rewrite it.

### 4.2 `downloadFile` (data export)

`web/components/settings/general-settings.tsx:353` calls `window.AndroidBridge.downloadFile(...)` because
Android's WebView won't honour a blob download. WKWebView on iOS 14+ _does_ handle
`<a download>` / blob URLs and hands off to the share sheet. Simplest path: keep the `AndroidBridge`
branch for Android, and on iOS fall through to `@capacitor/share` or `@capacitor/filesystem`
(`Directory.Documents` + `Share.share({url})`). Don't write a Swift `WKScriptMessageHandler` unless that
fails in testing.

### 4.3 In-app update prompt

`AppUpdateManagerFactory` / `AppUpdateType.IMMEDIATE` is Play-Store-only and **has no iOS counterpart** —
Apple forbids apps from forcing their own updates. The iOS equivalent is either nothing (users update via
the App Store) or a soft version check: query a `min-supported-version` value from the API on launch and
render an in-app "please update" screen linking to the App Store. Ship without it first.

### 4.4 Google Sign-In `onActivityResult` plumbing

The `GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_*` handling in `MainActivity` and the
`ModifiedMainActivityForSocialLoginPlugin` interface are the Android-specific half of
`@capgo/capacitor-social-login`. On iOS the plugin needs instead:

- an **iOS OAuth client ID** in Google Cloud Console (we currently only have
  `WEB_GOOGLE_CLIENT_ID` in `common/src/constants.ts:48`; the commented-out `ANDROID_GOOGLE_CLIENT_ID`
  shows the shape),
- the reversed client ID registered as a `CFBundleURLSchemes` entry in `Info.plist`,
- `SocialLogin.initialize({google: {webClientId, iOSClientId}})` in
  `web/lib/firebase/users.ts:93`.

The rest of `googleNativeLogin()` (exchange `idToken` → `signInWithCredential`) is unchanged.

---

## 5. Sign in with Apple (required, new work)

App Store Review Guideline **4.8** requires Sign in with Apple in any app that offers third-party social
login — which we do. This is not optional and is a common first-submission rejection.

Work involved:

1. Enable the **Sign in with Apple** capability in Xcode and on the App ID.
2. Enable the Apple provider in Firebase Console → Authentication, register the Services ID and key.
3. Add an Apple button to the login UI, gated on `Capacitor.getPlatform() === 'ios'`.
4. `@capgo/capacitor-social-login` supports `provider: 'apple'` — reuse the `googleNativeLogin` shape and
   `signInWithCredential(auth, OAuthProvider('apple.com').credential({idToken, rawNonce}))`.
5. Apple's **private relay emails** (`…@privaterelay.appleid.com`) are real and deliverable but forwarded.
   Check that onboarding, `backend/email/` sends, and any email-uniqueness logic tolerate them, and that
   we handle the "name is only returned on the very first authorization" quirk — if we drop it, the user
   has no name and Apple will never send it again.

---

## 6. Push notifications (APNs)

`@capacitor/push-notifications` is already wired in `web/lib/service/android-push.ts` and works on iOS, but
the transport underneath is different and the **backend payload is currently Android-only**.

Setup:

1. Push Notifications capability + `aps-environment` entitlement in Xcode.
2. Create an APNs **auth key** (`.p8`, preferred over certs — doesn't expire) in the Apple Developer
   portal, upload it to Firebase Console → Project Settings → Cloud Messaging, with Team ID and Key ID.
   Then FCM tokens keep working and no backend token-storage change is needed
   (`push_subscriptions_mobile` stays as-is).
3. Add the iOS app (bundle ID `com.compassconnections.app`) to the Firebase project and drop
   `GoogleService-Info.plist` into `ios/App/App/`.

**Backend change required.** `sendPushToToken` in `backend/shared/src/mobile.ts:96` builds a `TokenMessage`
with an `android.notification` block and a bare `data: {endpoint}`. Sent to an iOS token as-is, that is a
_data-only_ push: it will not display anything and is delivered at low priority or not at all. Add:

```ts
apns: {
  payload: {aps: {alert: {title: payload.title, body: payload.body}, sound: 'default', badge: …}},
  fcmOptions: payload.imageUrl ? {imageUrl: payload.imageUrl} : undefined,
},
```

Notes:

- Rich images on iOS additionally require a **Notification Service Extension** target; skip it until
  images matter, and the plain alert still shows.
- Notification taps: Android reads an `endpoint` intent extra in `onNewIntent`. On iOS use the
  cross-platform `PushNotifications.addListener('pushNotificationActionPerformed', …)` and read
  `notification.data.endpoint` — the `data` field above already carries it. Worth switching Android to
  the same listener while we're here.
- `pushNotificationReceived` only fires in the foreground on iOS, and iOS suppresses the banner in
  foreground by default — the existing `toast.success` fallback in `android-push.ts` covers that.
- Permission timing: `PushNotifications.requestPermissions()` triggers the one-shot iOS system prompt.
  The current code fires it right after login. Consider asking in context instead — a denied iOS prompt
  can only be reversed in Settings.

---

## 7. Build, sign, ship

Local (on macOS):

```bash
yarn build-web-view
npx cap sync ios
npx cap open ios     # then Product → Archive
```

From Linux/Windows there is no local archive step — push and let the `macos-latest` job below do it
([§2.1](#21-working-without-a-mac)). Everything up to `npx cap sync ios` still runs fine locally; it's only
`xcodebuild`/Archive that needs macOS.

Add `yarn build-sync-ios` mirroring `scripts/build_sync_android.sh`.

Versioning: `CFBundleShortVersionString` (user-visible, ≈ `versionName`) and `CFBundleVersion`
(build number, ≈ `versionCode`, must strictly increase per upload). Keep them in step with
`android/app/build.gradle` so a release is one version across both stores.

Signing and CI: the Android release path is
[`.github/workflows/cd-android.yml`](../.github/workflows/cd-android.yml) — bump `versionCode` on `main`,
Action builds a signed AAB and uploads to Play. The iOS analogue is a `macos-latest` job using **fastlane**
(`match` for certificate/profile management, `pilot` for TestFlight upload) with an **App Store Connect API
key** in GitHub Secrets. New secrets needed, alongside the existing `ANDROID_*` / `PLAY_SERVICE_ACCOUNT_JSON`:

```
APP_STORE_CONNECT_KEY_ID
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY_P8
MATCH_PASSWORD / MATCH_GIT_URL   (or a manually managed .p12 + provisioning profile)
```

Do the first submission by hand from Xcode to shake out the metadata, then automate. This is the step worth
renting a Mac for — App Store Connect metadata, screenshots and capability toggles are fiddly enough that
doing them blind through CI on the first pass invites a rejection round. Add a `symbolicatecrash` step to the
same runner so crash reports pulled off the device from Linux can be symbolicated.

---

## 8. App Review risks specific to us

Ordered by how likely they are to cost us a rejection round:

1. **Guideline 4.2 — "minimum functionality" / repackaged website.** A pure WebView wrapper gets rejected.
   Our defence is the same as on Play: local assets rather than a remote URL, plus genuine native
   integration (push, native share, native Google/Apple sign-in, deep links). Do **not** ship the
   remote-URL mode.
2. **Guideline 4.8 — Sign in with Apple.** See §5. Blocking.
3. **Guideline 5.1.1(v) — account deletion.** Apple requires in-app account deletion for any app with
   account creation, reachable without contacting support. Verify the settings flow does this on-device.
4. **Guideline 1.2 / 1.1.6 — UGC on a dating-adjacent app.** Expect scrutiny: they will want a report
   mechanism, a block mechanism, a published moderation policy, and a terms-of-service acceptance at
   signup. Have the moderation story documented before submitting.
5. **Age rating.** A connections app rates 17+/18+; set it honestly or risk removal.
6. **Guideline 3.1.1 — in-app purchase.** If anything paid is ever added, iOS must route it through IAP
   (30%/15%). Not an issue today; a reason not to add web-only checkout links to the iOS build later.
7. **Demo account.** Review needs working credentials in App Review notes, since the app is gated behind
   login. Prepare a seeded account with a populated profile.

---

## 9. Suggested order of work

1. Rename `isAndroidApp` → `isNativeApp`, `android-push.ts` → `native-push.ts`; branch on
   `Capacitor.getPlatform()`.
2. Move deep-link handling and notification-tap handling off `AndroidBridge`/intent extras onto
   `@capacitor/app` + `pushNotificationActionPerformed` (works on both platforms).
3. Add the `apns` block to `sendPushToToken` — harmless on Android, prerequisite for iOS.
4. `npx cap add ios`, get it running in the Simulator against the static export.
5. Firebase iOS app + APNs key; verify push end-to-end on the **physical device** from §2 — the Simulator
   has no APNs token, so this step cannot be faked.
6. Google Sign-In (iOS client ID) then Sign in with Apple.
7. Universal Links + `apple-app-site-association`.
8. Manual TestFlight build; internal testing.
9. fastlane + GitHub Action; first App Store submission.

Without a Mac ([§2.1](#21-working-without-a-mac)), reorder slightly: stand the CI job (step 9's fastlane
half) up right after step 4, since it replaces the Simulator as the way to get a build onto the phone, and do
steps 5–8 against TestFlight builds with `ios-webkit-debug-proxy` attached over cable. Batch the
Xcode-GUI-only work — capabilities for §4.1, §5 and §6 — into one rented-Mac session before step 5.

---

## 10. Resources

- [Capacitor iOS docs](https://capacitorjs.com/docs/ios)
- [Firebase iOS setup](https://firebase.google.com/docs/ios/setup) ·
  [APNs + FCM](https://firebase.google.com/docs/cloud-messaging/ios/certs)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Supporting Universal Links](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [fastlane for iOS](https://docs.fastlane.tools/getting-started/ios/setup/)
- Linux tooling (§2.1): [libimobiledevice](https://libimobiledevice.org/) ·
  [ios-webkit-debug-proxy](https://github.com/google/ios-webkit-debug-proxy)
