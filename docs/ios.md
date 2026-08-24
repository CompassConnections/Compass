# Implementing the iOS app

Implementation notes for shipping Compass on iOS, written against what the Android app ([
`android/README.md`](../android/README.md),
[`android/CLAUDE.md`](../android/CLAUDE.md)) already does, so the work is framed as "what carries over"
vs. "what has no iOS equivalent yet".

The strategy is the same as Android: **Capacitor wrapper around the existing Next.js static export**. No
React Native, no second UI codebase. `web/` stays the single source of the product.

---

## 0. Status

Everything that is code — the web-side platform branching, the backend payload, the Xcode project, the
release pipeline — is written and in the repo, the Apple Developer Program membership is **active**
(team `HFZVH8XR59`), and the app is **live on the App Store** (id `6804429364`). What is left is the
on-device checklist.

**None of it needed a Mac.** Every local step ran on an ordinary Linux box; the only macOS anywhere in
the story is the GitHub Actions `macos-15` runner that seeds the certificates (`ios-certs.yml`) and
archives the build (`cd-ios.yml`). No Mac was bought, borrowed or rented — the EC2 Mac day sketched in
[§2.1](#21-working-without-a-mac) was planned and never used, and everything that looked like it needed
Xcode's GUI turned out to be either a portal page or a text file. §2.1 has the full account of what ran
where.

Operational detail for all of it is in [`../ios/README.md`](../ios/README.md).

### Done (in the repo)

- [x] `isAndroidApp()` → `isNativeApp()`, with `isIosApp()` / `isAndroidApp()` / `nativePlatform()`
      for the places that genuinely diverge (`web/lib/util/webview.ts`).
- [x] `android-push.ts` → `web/lib/service/native-push.ts`, `AndroidPush` → `NativePush`.
- [x] Notification taps moved onto the cross-platform `pushNotificationActionPerformed` listener.
- [x] Deep links moved onto `@capacitor/app`'s `appUrlOpen` + `getLaunchUrl()` (`web/pages/_app.tsx`).
      The Android `AndroidBridge` path is still there alongside it — see §4.1 for why it stays.
- [x] `apns` block in `sendPushToToken` (`backend/shared/src/mobile.ts`), with `apns-collapse-id`
      mirroring Android's `collapseKey`.
- [x] Data export on iOS: `web/lib/util/download.ts` writes to Documents and opens the share sheet
      (`@capacitor/filesystem` + `@capacitor/share`) instead of the Android bridge.
- [x] `npx cap add ios` — `ios/App/…` scaffolded, `@capacitor/ios` added to `web/package.json`.
- [x] `capacitor.config.ts`: `ios.contentInset`, and a dev-server URL that resolves per platform.
- [x] `Info.plist`: microphone/camera/photo usage strings, `NSAllowsLocalNetworking`,
      `remote-notification` background mode, Google URL scheme, `ITSAppUsesNonExemptEncryption`.
- [x] `App.entitlements`: `aps-environment`, `applinks:` for both hosts, Sign in with Apple.
- [x] `AppDelegate.swift`: Firebase init + the APNs→FCM token bridge (see §6 — this is required, not
      optional, and the earlier draft of this doc was wrong to imply otherwise).
- [x] `FirebaseMessaging` pod; iOS deployment target **15.0** (Capacitor 7 needs 14.0, but Apple's
      ITMS-90068 warning requires 15.0+ for uploads from spring 2027, and iOS 15 reaches back to the
      iPhone 6s, so the dropped-device cost is negligible).
- [x] Sign in with Apple end to end on the web side: `appleNativeLogin()` in
      `web/lib/firebase/users.ts`, `AppleButton`, wired into `/signin` and `/register`, gated on
      `isIosApp()`. Handles the nonce and the name-only-on-first-authorization quirk.
- [x] `web/public/.well-known/apple-app-site-association` + a `headers()` rule in `web/next.config.ts`
      serving it as `application/json`.
- [x] `yarn build-sync-ios` / `yarn sync-ios`, mirroring the Android scripts — verified end to end on
      Linux (`pod install` and `xcodebuild` no-op, everything else runs).
- [x] fastlane (`ios/fastlane/`) and [`.github/workflows/cd-ios.yml`](../.github/workflows/cd-ios.yml),
      triggered by a `CURRENT_PROJECT_VERSION` bump exactly as Android's is by `versionCode`.
- [x] Google iOS OAuth client created; `IOS_GOOGLE_CLIENT_ID` (`common/src/constants.ts`) and its
      reversed twin in `Info.plist` both filled in.
- [x] Firebase iOS app registered; `GoogleService-Info.plist` in `ios/App/App/` (gitignored).
- [x] Capawesome live updates removed outright — the plugin was being synced into the iOS shell, and a
      remote-bundle mechanism is an extra thing to justify under App Review for a feature we disabled in
      early 2026. See [`../android/README.md`](../android/README.md#live-updates-removed).
- [x] App Store screenshots rendered at 1290×2796 (`media-creator/out/store/ios/`, eight frames);
      `MARKETING_VERSION` in step with Android's `versionName`.
- [x] Apple Developer Program membership active — team id `HFZVH8XR59`, filled into
      `web/public/.well-known/apple-app-site-association` (both `appIDs` and `webcredentials`) and into
      the repo-root `.env` for local fastlane runs.
- [x] Sign in with Apple in the browser: `appleWebLogin()` / `appleLogin()` in
      `web/lib/firebase/users.ts`, both entry points routed through the dispatcher (§5.3).
- [x] The six inline "sign in to continue" prompts (comment boxes, message buttons) now call
      `promptSignIn()` → `/signin?redirect=…` instead of `firebaseLogin()`, which was Google-only on
      every platform and would have stranded Apple-only accounts.

### Placeholders

None left. `IOS_GOOGLE_CLIENT_ID`, `APPLE_TEAM_ID` (`HFZVH8XR59`) and `APPLE_SERVICES_ID`
(`com.compassconnections.web`) are all filled in, and `GoogleService-Info.plist` is in place. What
remains is console configuration and the first build, not values to paste into the repo.

### To do — no Apple account needed

- [x] `match` certificate repo: empty private GitHub repo, a passphrase, and a fine-grained PAT →
      `MATCH_GIT_URL`, `MATCH_PASSWORD`, `MATCH_GIT_BASIC_AUTHORIZATION` ([`../ios/README.md`](../ios/README.md) §4).
- [x] `IOS_GOOGLE_SERVICES_PLIST` secret from the local `GoogleService-Info.plist`.
- [x] Device toolchain on the Linux box — `libimobiledevice-utils`, `ideviceinstaller`, and
      `ios-webkit-debug-proxy` built from source ([`../ios/README.md`](../ios/README.md) §5).
- [x] Review prep that is pure web work (§8): demo account seeded, explicit ToS checkbox at
      `/register`, block/delete pointers in `web/public/md/terms.md` and `web/pages/help.tsx` fixed.
- [ ] Age rating decision (18+ — see [app-store-listing.md](app-store-listing.md)).
- [ ] **Set `IOS_WEB_DEBUG` back to `''` in `.github/workflows/cd-ios.yml` before submitting.** It is
      `'1'` while the WebView layer is being debugged, which makes the shipped WKWebView inspectable —
      fine for TestFlight, not for a build anyone can install. Nothing fails if it is left on, which is
      exactly why it needs to be on a checklist.

### To do — needs the Apple consoles or the phone

- [x] Register the App ID `com.compassconnections.app` with Push Notifications, Associated Domains and
      Sign in with Apple enabled, and create the app record in App Store Connect.
- [x] Firebase console → upload the APNs `.p8` auth key with Team ID and Key ID.
- [x] Apple portal → create the Services ID `com.compassconnections.web` and configure it against
      Firebase's `__/auth/handler` (§5.3), then paste it into Firebase. The repo side is already done —
      `APPLE_SERVICES_ID` is set, so the browser Apple button goes live with the next deploy and will
      dead-end until Firebase agrees.
- [x] Firebase console → Authentication → enable the Apple provider and fill the OAuth code flow
      configuration (Team ID, Key ID, Sign in with Apple `.p8`) — §5.2, needed for §8.3's revocation.
- [x] Revoke the Apple refresh token from the client before calling `me/delete` (§8.3). The console
      half (OAuth code flow config) must still be done **before anyone signs in with Apple**, since
      Firebase can only revoke a token it captured.
- [x] Set the eight GitHub secrets ([`../ios/README.md`](../ios/README.md) §4), then seed the
      certificate repo by running the **`iOS Certificates (one-off)`** workflow from the Actions tab.
      It runs the `certs` lane on a `macos-15` runner. Creating certificates needs macOS — on Linux
      `match` dies installing the profile _after_ Apple has issued the certificate, stranding it in a
      slot with a lost private key (README §4 has the detail). Verify the certs repo has commits on
      `master` afterwards.
- [x] First build reached TestFlight (App ID `6804429364`), built by `cd-ios.yml` on `macos-15`:
      `match` readonly, `aps-environment` rewritten to `production`, manual signing with
      `Apple Distribution: Martin Braquet`, 31 dSYMs archived. Build 1 was then **rejected by App
      Store Connect processing** with `ITMS-90129` (see §8.8); build 2 carries the fix.

      `CURRENT_PROJECT_VERSION` must be bumped in **both** places in `project.pbxproj` (Debug and
      Release) for every upload. Apple burns the build number on *receipt*, not on acceptance — a
      rejected build still consumes it, and `cd-ios.yml:32` reads only the first match when deciding
      whether to build.

- [ ] Work through [On-device verification](#on-device-verification-first-testflight-build) below.
      Internal TestFlight needs no Beta App Review, so builds are installable minutes after processing.
- [x] App Store Connect app record and listing metadata — everything but the build.
- [x] Live: `IOS_APP_URL` (`common/src/constants.ts`) carries the real App Store id `6804429364`,
      which flips `IS_IOS_APP_PUBLISHED` and with it the /download badge, the about-page copy and the
      Smart App Banner. The sidebar needs no separate App Store row — it resolves per device through
      `useAppDownload`.

Everything left is a web console or a GitHub Actions run. **The EC2 Mac day described in §2.1 was
never needed**: certificate seeding is the `iOS Certificates (one-off)` workflow, the archive is
`cd-ios.yml`, and the App ID capability toggles turned out to be portal pages rather than Xcode. Rent a
Mac only if something ever needs interactive Xcode debugging — through submission and release, nothing
has.

### Still open in the codebase

Neither blocks TestFlight, both should land before a public release:

- [ ] **Filter blocked users' existing comments.** `blockedUserIdSet` (`web/hooks/use-user.ts`) exists
      and is unused; the thread builders in `profile-comments.tsx` and `vote-comments.tsx` still render
      them. This is the last place the block toast's promise is not kept — see §8.4.
- [ ] **No workflow invokes the `symbolicate` lane.** `Fastfile:105` says to run it on the CI runner,
      but `cd-ios.yml`'s `workflow_dispatch` runs `beta`. The dSYMs are archived (`cd-ios.yml:113`);
      what is missing is a dispatch path that runs `symbolicate` on the `macos-15` runner. That runner
      is the only macOS we have, and it is enough — this does not need a Mac, just a workflow input.

### On-device verification (first TestFlight build)

The Simulator cannot do most of this — no APNs token, no real Universal Link handling — so it waits for
hardware. With the phone on USB, `idevicesyslog | grep -i compass` gives the native side and
`ios_webkit_debug_proxy` gives the JS console (§5 of the README); between them almost everything below
is diagnosable from Linux.

**Shell and layout**

- [ ] App launches and renders the bundled build. In airplane mode the shell must still appear — if it
      does not, it is loading a remote URL, which is both a §8.1 rejection risk and a bug.
- [ ] Safe areas: nothing under the notch or the home indicator, and nothing _double_-padded.
      `ios.contentInset: 'always'` plus `env(safe-area-inset-*)` in `globals.css` can compound.
- [ ] Keyboard show/hide does not leave the composer stranded; status-bar colour follows the theme.

**Push (the one that cannot be faked)**

- [ ] Permission prompt appears, and `save-subscription-mobile` records a token. It must be an **FCM**
      token, not a raw APNs one — `AppDelegate.swift` does that bridging (§6). A raw APNs token makes
      every send fail with `messaging/invalid-argument`, and `sendPushToToken` then deletes the
      subscription, so the symptom is "notifications stopped" rather than an error.
- [ ] A real push arrives **and displays**. Silent delivery means the `apns` block in
      `backend/shared/src/mobile.ts` is not being applied.
- [ ] If nothing ever arrives with no error anywhere, suspect `aps-environment`: a TestFlight build must
      carry `production`, which the `beta` lane rewrites in place (§7). A `development` value registers
      against sandbox APNs and fails silently.
- [ ] Tapping a notification opens the right screen — `pushNotificationActionPerformed`, not the
      Android bridge.

**Links**

- [ ] Universal Links: tap a `compassmeet.com` link **from Messages or Notes**, not by typing it into
      Safari's address bar — typed URLs deliberately do not trigger Universal Links, which is the most
      common false negative here.
- [ ] Both hosts in `App.entitlements` resolve, and `/api/*` and `/.well-known/*` still open in the
      browser rather than the app (the `exclude` rules in the AASA file).
- [ ] iOS caches the AASA aggressively; if a link opens in Safari, reinstall before assuming the file
      is wrong.
- [ ] Cold start and warm start both route: `getLaunchUrl()` covers the first, `appUrlOpen` the second.

**Auth**

- [ ] Google sign-in completes and returns to the app — the return leg is the reversed client id URL
      scheme in `Info.plist`, so a mismatch shows up as "consent succeeded, nothing happened".
- [ ] Apple sign-in completes (guideline 4.8 depends on it).
- [ ] Try Apple with an address that already has a Google account. It will fail until the linking item
      above is built; confirm the failure is at least legible.

**Product surfaces that differ on iOS**

- [ ] Data export writes to Documents and opens the share sheet (`@capacitor/filesystem` +
      `@capacitor/share`), not the Android bridge.
- [ ] Voice auto-fill: the microphone prompt appears — a missing usage string kills the app outright
      rather than erroring — and `getUserMedia` works, which needs the default `capacitor://localhost`
      origin to stay a secure context.
- [ ] Native share sheet from a profile.
- [ ] Blocking: the profile leaves the grid, the existing conversation becomes read-only but stays
      readable, and the Message button disappears from that profile.

**Review-critical**

- [ ] Account deletion end to end, in-app (guideline 5.1.1(v)). Expect an **extra Apple sheet** during
      deletion for an Apple-linked account — `revokeAppleToken()` re-authenticates before revoking.
- [ ] Report and block are both reachable from the ⋮ menu on a profile, and report from inside a
      conversation.
- [ ] Sign in as the demo account exactly as a reviewer would, and confirm messaging works — it is
      gated on `emailVerified` in every shipped build (`dev-flags.ts:16`).

---

## 1. What already works, unchanged

These are not iOS work items — they're already platform-agnostic and will light up as soon as an iOS
target exists:

| Piece                                            | Where                                             |
| ------------------------------------------------ | ------------------------------------------------- |
| The whole UI                                     | `web/` — same static export as Android            |
| Static-export build (strips SSR/ISR/SSG)         | `scripts/build_web_view.sh`                       |
| Native-platform detection                        | `web/lib/util/webview.ts` (`isNativeApp`)         |
| Safe-area insets (notch / home indicator)        | `web/styles/globals.css` `env(safe-area-inset-*)` |
| Status-bar theming                               | `web/hooks/use-theme.ts` (`updateStatusBar`)      |
| Keyboard show/hide handling                      | `web/pages/_app.tsx` (`@capacitor/keyboard`)      |
| Native share sheet                               | `web/lib/util/share.ts` (`@capacitor/share`)      |
| Push registration + token save                   | `web/lib/service/native-push.ts`                  |
| `save-subscription-mobile` endpoint + FCM tokens | `backend/api/src/save-subscription-mobile.ts`     |

The Capacitor plugins we already depend on (`@capacitor/app`, `keyboard`, `push-notifications`, `share`,
`status-bar`, `@capgo/capacitor-social-login`) all support iOS. Nothing needs replacing.

### Naming cleanup (done)

`isAndroidApp()`, `AndroidPush`, `android-push.ts` were all misnomers the moment iOS existed — they
already meant "native app". They are now `isNativeApp()` / `NativePush` / `native-push.ts`.
`web/lib/util/webview.ts` additionally exports `nativePlatform()` (`'ios' | 'android' | 'web'`) and
`isIosApp()` / `isAndroidApp()` on top of it, for the handful of places where behaviour genuinely
diverges — App Store rules, the Android-only `AndroidBridge`, the data export. `isNativeApp()` stays the
default: the product is meant to look the same on both. `isNativeMobile()` was already right and stays.

---

## 2. Prerequisites (hard blockers)

- **macOS, but only as a CI runner.** Xcode is macOS-only and there is no supported way to build or sign
  an iOS app without it — but for the whole of this project that macOS was a `macos-15` GitHub Actions
  runner (billed at 10× Linux minutes), never a machine anyone sat in front of. See
  [§2.1](#21-working-without-a-mac): the entire build → sign → TestFlight → App Store loop is drivable
  from Linux.
- **Apple Developer Program membership** — $99/year. Not just for shipping: the Push Notifications and
  Sign in with Apple **entitlements are unavailable on a free account**, so the two features that make
  this more than a wrapped website can't even be built without it.
- **A physical iPhone** — see below. The Simulator is not sufficient.
- Node 22+ locally; Java is _not_ needed. Xcode 16+ and CocoaPods are only ever installed on the CI
  runner — on Linux `pod install` and `xcodebuild` no-op and everything else in the sync still runs.

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

**We test on an iPhone 11.** It has a notch and runs a current iOS, which is the whole requirement — the
recommendation below is what to buy if a second device is ever needed.

**Recommendation: a refurbished iPhone 12 or 13, ~$150–250.** Notch, current iOS, cheap. That's the whole
requirement.

**Avoid the iPhone SE (2nd/3rd gen)** even though it's often the cheapest option — Home-button body, no
notch, smaller screen. It would miss exactly the class of bug the device is being bought to catch, to save
$50–100. False economy.

Dynamic Island phones (14 Pro and later) have slightly larger top insets than notched ones, but since
everything is driven by `env()` rather than hardcoded values, a notched device is a fine proxy. Check the
top of the profile page and the filter sheet on whatever you get.

### 2.1 Working without a Mac

We develop on Linux. This section was written as a plan; it is now a record. **The app was built, signed,
submitted and published without a Mac** — none bought, none rented, none borrowed. The only macOS involved
was the GitHub Actions `macos-15` runner. What ran where, in the end:

| Step                                                                                            | Where it ran                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Web build, `npx cap sync ios`, icon generation (`yarn build-sync-ios`)                          | Linux, locally                                                           |
| Editing `project.pbxproj`, `Info.plist`, `App.entitlements`, `Podfile`                          | Linux, in a normal editor                                                |
| App ID + capabilities, Services ID, APNs `.p8`, Firebase, App Store Connect record and metadata | developer.apple.com / appstoreconnect.apple.com / Firebase, in a browser |
| Certificate + provisioning profile creation (`match`)                                           | `macos-15` runner, once — `ios-certs.yml`                                |
| `pod install`, `xcodebuild archive`, TestFlight and App Store upload                            | `macos-15` runner — `cd-ios.yml`                                         |
| Getting builds onto the phone                                                                   | TestFlight app, over the air                                             |
| Device logs, JS console, DOM, network, crash reports                                            | Linux, over USB (`libimobiledevice`, `ios-webkit-debug-proxy`)           |

The two steps that genuinely require macOS — creating certificates and running `xcodebuild` — are each one
lane in a workflow file. "Needing a Mac" reduces to "needing a runner", and a runner is a YAML line.

**Build and ship from CI.** The `macos-15` runner in §7 does `npx cap sync ios`, CocoaPods, `xcodebuild`,
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

**What we expected to need an interactive macOS session for — and didn't:**

- _First-time Apple Developer setup, assumed to be Xcode's UI_ — Associated Domains (§4.1), Sign in with
  Apple (§5), push entitlement (§6). All three are toggles on the App ID in the developer portal, and the
  matching `App.entitlements` is text. Xcode's capability editor is a convenience that writes those two
  things for you; doing it directly is fine. The provisioning-profile mismatch cycles budgeted for here did
  not materialise — `match` regenerates the profile from the App ID, so the entitlements and the profile
  cannot drift the way they do when a human keeps both in sync by hand.
- _The first App Store Connect submission and its metadata (§7)_ — also entirely a web console. The build
  came from `cd-ios.yml` like every one since; the listing, screenshots and review notes are forms.
- **Crash symbolication** — turning a `.ips` from `idevicecrashreport` into a readable stack trace needs the
  `.dSYM` and Xcode's `symbolicatecrash`. This is the one item still open, and the fix is a step on the CI
  runner (the `symbolicate` lane already in `Fastfile`), not a Mac.

The one thing a Mac would still buy is interactive Xcode: Simulator, Instruments, breakpoints in Swift. We
have not wanted it. The native layer is `AppDelegate.swift` and nothing else, everything above it is a
WebView that Chrome DevTools attaches to over USB from Linux, and the Simulator cannot do the one test that
mattered (§6 push) anyway.

**The EC2 Mac day we planned and never used.** Kept here as the fallback if interactive Xcode ever does
become necessary — and because the shape of the bill is worth knowing before starting. EC2 Mac runs on
**dedicated hosts with a 24-hour minimum allocation**, so the smallest possible session costs a full day
(`mac2.metal`, Apple silicon, ~$0.65/hr on-demand ≈ **$16 for that minimum**), and the host keeps billing
until it is _released_, not merely until the instance is stopped. Releasing is also rate-limited by the same
24-hour floor. Budget one day and batch everything into it.

Setup, from Linux:

```bash
# 1. Allocate the dedicated host (a region that has mac2 capacity; us-east-1 is safest)
aws ec2 allocate-hosts --instance-type mac2.metal --availability-zone us-east-1a \
    --auto-placement host --quantity 1

# 2. Launch onto it. Pick the newest macOS AMI so Xcode is current:
aws ec2 describe-images --owners amazon \
    --filters "Name=name,Values=amzn-ec2-macos-15*" \
    --query 'sort_by(Images,&CreationDate)[-1].[ImageId,Name]' --output text

aws ec2 run-instances --instance-type mac2.metal --image-id <ami> \
    --placement "HostId=<host-id>" --key-name <your-key> \
    --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=200}'

# 3. SSH in, then grow the APFS container to the EBS volume — the AMI ships a 100 GB filesystem
#    on whatever disk you asked for, and Xcode alone needs ~40 GB.
ssh ec2-user@<ip>
PDISK=$(diskutil list physical external | head -n1 | cut -d" " -f1)
APFSCONT=$(diskutil list | grep "Apple_APFS" | tr -s " " | cut -d" " -f8)
sudo diskutil repairDisk $PDISK
sudo diskutil apfs resizeContainer $APFSCONT 0

# 4. Xcode + tooling
sudo softwareupdate --install-rosetta --agree-to-license   # some pods still need it
xcode-select --install
# Xcode itself: `xcodes` is far less painful than the App Store on a headless box
brew install xcodesorg/made/xcodes && xcodes install --latest --experimental-unxip
sudo xcodebuild -license accept
sudo gem install cocoapods
```

For the GUI parts (capability toggles, App Store Connect), enable Screen Sharing and tunnel VNC over
SSH — `ssh -L 5900:localhost:5900 ec2-user@<ip>` — rather than exposing 5900.

Recommendation, in hindsight: skip it. CI (`macos-15` runner) for the certificate seeding and every build,
a browser for the Apple and Firebase consoles, cable + `ios-webkit-debug-proxy` for day-to-day debugging.
That covered the whole project, from `npx cap add ios` to a live App Store listing.

---

## 3. Scaffolding the platform — **done**

Already run; `ios/` is in the repo and `capacitor.config.ts` carries the `ios` block. Kept here as the
record of what was done and why.

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
}
,
```

`scheme` was deliberately **not** overridden. The app is served from the default `capacitor://localhost`,
which WebKit treats as a secure origin — and two things we ship need that: `getUserMedia` for voice
auto-fill, and `crypto.subtle` for the Sign-in-with-Apple nonce. Renaming the scheme buys nothing and
risks both.

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

On iOS **don't reimplement the bridge** — `@capacitor/app` already gives you this cross-platform, and
this is now what `web/pages/_app.tsx` does:

```ts
App.addListener('appUrlOpen', ({url}) => handleAppLink({endpoint: new URL(url).pathname}))
const launch = await App.getLaunchUrl() // replaces getPendingDeepLink()
```

The `AndroidBridge` half is still there alongside it rather than deleted: Android's `MainActivity` also
pushes _notification_ endpoints in through `handleAppLink` directly, and both paths are harmless together
because `handleAppLink` no-ops when the endpoint already matches the current path. Deleting it is a
separate Android change, worth doing once iOS is shipping and the Capacitor path is proven on hardware.

Universal Links (the iOS equivalent of the `autoVerify` intent filter for `compassmeet.com`) need:

- the **Associated Domains** capability with `applinks:compassmeet.com` and `applinks:www.compassmeet.com`,
- an `apple-app-site-association` JSON file served from `https://compassmeet.com/.well-known/`, no
  redirect, `Content-Type: application/json`. Add it to `web/public/.well-known/` and confirm the Vercel
  config doesn't rewrite it.

### 4.2 `downloadFile` (data export)

`web/components/settings/general-settings.tsx` called `window.AndroidBridge.downloadFile(...)` because
Android's WebView won't honour a blob download. The three cases now live behind one helper,
`downloadTextFile` in `web/lib/util/download.ts`: `AndroidBridge` on Android, `@capacitor/filesystem`
(`Directory.Documents`) + `Share.share({url})` on iOS, plain blob URL in the browser.

The iOS branch does not rely on WKWebView honouring `<a download>`: Capacitor doesn't wire up
`WKDownloadDelegate`, and there is no Downloads folder to write to anyway — handing the file to the share
sheet is how iOS expects a file to leave an app. No Swift `WKScriptMessageHandler` needed.

### 4.3 In-app update prompt

`AppUpdateManagerFactory` / `AppUpdateType.IMMEDIATE` is Play-Store-only and **has no iOS counterpart** —
Apple forbids apps from forcing their own updates. The iOS equivalent is either nothing (users update via
the App Store) or a soft version check: query a `min-supported-version` value from the API on launch and
render an in-app "please update" screen linking to the App Store. Ship without it first.

### 4.4 Google Sign-In `onActivityResult` plumbing

The `GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_*` handling in `MainActivity` and the
`ModifiedMainActivityForSocialLoginPlugin` interface are the Android-specific half of
`@capgo/capacitor-social-login`. On iOS the plugin needs instead:

- an **iOS OAuth client ID** in Google Cloud Console — `IOS_GOOGLE_CLIENT_ID` in
  `common/src/constants.ts` is the slot, currently a placeholder,
- the _reversed_ form of the same id as a `CFBundleURLSchemes` entry in `ios/App/App/Info.plist`, also
  currently a placeholder. **Both must be filled in together**,
- `SocialLogin.initialize({google: {webClientId, iOSClientId}})` — done, and `iOSClientId` is omitted
  while the placeholder is in place so a half-configured build fails at the Google SDK rather than
  silently signing in wrong.

The rest of `googleNativeLogin()` (exchange `idToken` → `signInWithCredential`) is unchanged — Firebase
verifies the token against the _web_ client on both platforms, which is why `webClientId` still has to be
passed.

---

## 5. Sign in with Apple (required, new work)

App Store Review Guideline **4.8** requires Sign in with Apple in any app that offers third-party social
login — which we do. This is not optional and is a common first-submission rejection.

Work involved:

1. Enable the **Sign in with Apple** capability in Xcode and on the App ID. _(The entitlement is in
   `App.entitlements`; the App ID toggle is still to do.)_
2. Enable the Apple provider in Firebase Console → Authentication, and fill in **both** halves:
   - the **Services ID** — see §5.3. An earlier draft of this doc said to leave it blank, on the
     reasoning that the native flow does not use it. That was right about the native flow and wrong
     about the product: without it there is no browser flow, and an account created with Apple in the
     iOS app is locked to that app forever.
   - the collapsed **OAuth code flow configuration** (Team ID, Key ID, Sign in with Apple `.p8`),
     without which the token revocation in §8.3 is impossible.

   _(Both to do — they need the membership.)_

3. **Done** — `AppleButton` in `web/components/buttons/sign-up-button.tsx`, wired into `/signin` and
   `/register`, gated on `canAppleLogin()`. The gate is resolved in an effect rather than during render:
   the Capacitor bridge doesn't exist on the server or in the first client render, so branching the
   markup on it directly would be a hydration mismatch.
4. **Done** — `appleNativeLogin()` in `web/lib/firebase/users.ts`, same shape as `googleNativeLogin`.

   The nonce is the fiddly part. Apple embeds whatever nonce the request carries _verbatim_ into the
   identity token, and Firebase compares that claim against `SHA256(rawNonce)` — so the request gets the
   hash and Firebase gets the raw value. `@capgo/capacitor-social-login` passes `options.nonce` straight
   through to `ASAuthorizationAppleIDRequest.nonce` without hashing, so the hashing is ours to do. If
   `crypto.subtle` is unavailable (it needs a secure context, which the cleartext dev-server mode is not)
   we sign in with no nonce at all, which both Apple and Firebase accept.

5. Apple's **private relay emails** (`…@privaterelay.appleid.com`) are real and deliverable but forwarded.
   Still to verify on-device that onboarding, `backend/email/` sends, and any email-uniqueness logic
   tolerate them.

   The "name is only returned on the very first authorization" quirk **is** handled: `appleNativeLogin`
   writes `givenName familyName` onto the Firebase user with `updateProfile` as soon as it sees them,
   because `web/pages/signup.tsx` reads `auth.currentUser?.displayName` when seeding the profile and Apple
   will never send the name again. On the web path Firebase populates `displayName` itself, so there is
   nothing to persist by hand.

### 5.3 Sign in with Apple in the browser

Guideline 4.8 only asks for Apple sign-in _inside the app_, so it is tempting to stop there. The reason
not to is ours, not Apple's: a user who signs up with Apple on iOS ends up with `apple.com` as their only
Firebase provider and, more often than not, a `@privaterelay.appleid.com` address. On desktop they would
see no Apple button, have no password to reset, and creating a Google account would give them a _different_
account. That is a permanent lockout, and it starts the day the iOS app ships.

**Code — done.** `appleWebLogin()` in `web/lib/firebase/users.ts` runs
`signInWithPopup(auth, new OAuthProvider('apple.com'))`; `appleLogin()` dispatches to it or to
`appleNativeLogin()` on `isIosApp()`, and both `/signin` and `/register` call the dispatcher.

**Console — to do, needs the membership.** In the Apple Developer portal:

1. Create a **Services ID** (Identifiers → `+` → Services IDs), e.g. `com.compassconnections.web`. It is a
   separate identifier from the App ID — the App ID authorises the native flow, the Services ID authorises
   the web one. Enable Sign in with Apple on it and click Configure.
2. Set the primary App ID to `com.compassconnections.app`, add `compass-130ba.firebaseapp.com` under
   Domains and Subdomains, and `https://compass-130ba.firebaseapp.com/__/auth/handler` as the Return URL —
   the callback Firebase shows on its own Apple provider screen. If Apple asks you to verify the domain,
   it hands you an `apple-developer-domain-association.txt` to serve from `/.well-known/` on that host;
   that is Firebase's domain, not ours, so it should not come up unless we move to a custom auth domain.
3. Paste the Services ID into Firebase Console → Authentication → Apple → **Services ID**, and into
   `APPLE_SERVICES_ID` in `common/src/constants.ts`.

Firebase labels that field "Services ID (not required for Apple)", which is true only of the native iOS
flow — the moment you fill in the OAuth code flow configuration that §5.2 and §8.3 need, Firebase
requires a Services ID too. So the browser flow and the revocation requirement land on the same
prerequisite; there is no version of this where the field stays empty.

The constant is a **gate, not a credential** — it is never sent anywhere, and the real value lives in
Firebase. A mismatch between the two would not break sign-in, only the documentation, but keep them in
step anyway.

That last paste is the switch. `canAppleLogin()` returns `HAS_APPLE_SERVICES_ID` in a browser, so the
button stays hidden until the constant is real — rendering it earlier would offer a route that dead-ends
in `auth/operation-not-allowed`.

**Android is still a gap.** Apple refuses to render its authorization page inside an embedded WebView, so
`signInWithPopup` cannot work in the Android shell and `canAppleLogin()` returns false there. Closing it
means the native plugin path with the same Services ID plus an Android redirect. Not urgent — nobody can
have an Apple-only account until the iOS app ships — but it is the same lockout one platform over.

---

## 6. Push notifications (APNs)

`@capacitor/push-notifications` is already wired in `web/lib/service/native-push.ts` and works on iOS, but
the transport underneath is different and the backend payload was Android-only.

Setup:

1. Push Notifications capability + `aps-environment` entitlement — in `ios/App/App/App.entitlements`,
   and toggled on the App ID in the developer portal.
2. Create an APNs **auth key** (`.p8`, preferred over certs — doesn't expire) in the Apple Developer
   portal, upload it to Firebase Console → Project Settings → Cloud Messaging, with Team ID and Key ID.

   The key's Configure screen has two settings Apple will not let you change afterwards, and the wrong
   answer to the first one fails silently:
   - **Environment → `Sandbox & Production`**, never `Sandbox` alone. The `beta` lane rewrites
     `aps-environment` to `production` before archiving (§7), so every TestFlight and App Store build
     registers against production APNs. A sandbox-only key cannot reach those devices and reports no
     error — the pushes simply never arrive, and the search starts in `AppDelegate.swift` instead of in
     a dropdown.
   - **Key Restriction → `Team Scoped (All Topics)`**. Works for any bundle id in the team, which is
     what Firebase expects; Topic Specific pins the key to named bundle ids for no benefit here.

   Download the `.p8` at once — Apple allows exactly one download, and a lost key means creating another.
   Keys land in [`../ios/private/`](../ios/private/README.md), which is gitignored (plus a global `*.p8`
   rule): unlike `GoogleService-Info.plist`, these are bearer credentials. Nothing in the build reads the
   APNs key — it is uploaded to Firebase through the browser, and the Key ID goes in the same form.

3. Add the iOS app (bundle ID `com.compassconnections.app`) to the Firebase project and drop
   `GoogleService-Info.plist` into `ios/App/App/` (gitignored; CI writes it from
   `IOS_GOOGLE_SERVICES_PLIST`).

**Correction to an earlier draft of this doc:** step 2 does _not_ by itself mean "FCM tokens keep
working". `@capacitor/push-notifications` on iOS reports the raw **APNs** device token, which
`admin.messaging().send({token})` cannot address — every send would fail with
`messaging/invalid-argument`, and `sendPushToToken` would then helpfully delete the subscription. Making
the token an FCM one is native work, now done in `ios/App/App/AppDelegate.swift`: hand the APNs token to
`Messaging.messaging().apnsToken`, ask for `Messaging.messaging().token`, and post _that_ on
`.capacitorDidRegisterForRemoteNotifications` — the plugin accepts either a `Data` (APNs) or a `String`
(already resolved) there. With that in place `push_subscriptions_mobile` really does stay as-is, because
both platforms now save the same kind of token.

**Backend change required.** `sendPushToToken` in `backend/shared/src/mobile.ts:96` builds a `TokenMessage`
with an `android.notification` block and a bare `data: {endpoint}`. Sent to an iOS token as-is, that is a
_data-only_ push: it will not display anything and is delivered at low priority or not at all. Add:

```ts
apns: {
    payload: {
        aps: {
            alert: {
                title: payload.title, body
            :
                payload.body
            }
        ,
            sound: 'default', badge
        : …
        }
    }
,
    fcmOptions: payload.imageUrl ? {imageUrl: payload.imageUrl} : undefined,
}
,
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

Locally, on Linux — this is the whole local half:

```bash
yarn build-sync-ios      # web export + `npx cap sync ios` + icons. No archive step exists here.
git push                 # a bumped CURRENT_PROJECT_VERSION on `main` triggers cd-ios.yml
```

There is no local archive and never was: push and let the `macos-15` job below do it
([§2.1](#21-working-without-a-mac)). Everything up to `npx cap sync ios` runs fine on Linux; only
`pod install` and `xcodebuild`/Archive need macOS, and both live in CI. On a Mac the equivalent would be
`npx cap open ios` → Product → Archive — we have never run it.

`yarn build-sync-ios` (mirroring `scripts/build_sync_android.sh`) does the first two, plus
`npx capacitor-assets generate --ios` — the generated icons are gitignored, exactly as on Android, so they
have to be regenerated on every build including CI.

Versioning: `CFBundleShortVersionString` (user-visible, ≈ `versionName`) and `CFBundleVersion`
(build number, ≈ `versionCode`, must strictly increase per upload). Keep them in step with
`android/app/build.gradle` so a release is one version across both stores.

Signing and CI: the Android release path is
[`.github/workflows/cd-android.yml`](../.github/workflows/cd-android.yml) — bump `versionCode` on `main`,
Action builds a signed AAB and uploads to Play. The iOS analogue is
[`.github/workflows/cd-ios.yml`](../.github/workflows/cd-ios.yml): bump `CURRENT_PROJECT_VERSION` in
`ios/App/App.xcodeproj/project.pbxproj` on `main`, and a `macos-15` job runs **fastlane**
(`match` for certificate/profile management, `pilot` for TestFlight upload) authenticating with an **App
Store Connect API key**. It also accepts `workflow_dispatch`, so a failed upload can be retried without
another version bump — macOS minutes bill at 10× Linux, hence the version gate rather than building every
push.

Why `match` rather than `xcodebuild -allowProvisioningUpdates` with the API key: the latter can _create_ a
distribution certificate but cannot persist its private key, so every CI run would burn one of the three an
account is allowed. `match` keeps one in an encrypted git repo and reuses it forever.

The secrets, alongside the existing `ANDROID_*` / `PLAY_SERVICE_ACCOUNT_JSON`, are listed with where each
comes from in [`../ios/README.md`](../ios/README.md) §4:

```
APPLE_TEAM_ID
APP_STORE_CONNECT_KEY_ID
APP_STORE_CONNECT_ISSUER_ID
APP_STORE_CONNECT_KEY_P8
MATCH_GIT_URL / MATCH_PASSWORD / MATCH_GIT_BASIC_AUTHORIZATION
IOS_GOOGLE_SERVICES_PLIST
```

One thing the lane does that is easy to miss: it rewrites `aps-environment` from `development` to
`production` in `App.entitlements` before archiving. A TestFlight or App Store build carrying
`development` registers against the _sandbox_ APNs environment, and pushes then silently never arrive —
there is no error anywhere to notice.

The first submission went through the App Store Connect **web console**, not Xcode: the build came from
`cd-ios.yml` exactly like every one since, and the metadata, screenshots and review notes are browser forms.
The rejection round warned about here did happen — `ITMS-90129`, a `CFBundleDisplayName` collision (§8.8) —
but it is a name clash Apple's upload check reports by email, and sitting at a Mac would not have surfaced it
any earlier. Still worth doing: add a `symbolicatecrash` step to the same runner so crash reports pulled off
the device from Linux can be symbolicated.

---

## 8. App Review risks specific to us

Ordered by how likely they are to cost us a rejection round:

1. **Guideline 4.2 — "minimum functionality" / repackaged website.** A pure WebView wrapper gets rejected.
   Our defence is the same as on Play: local assets rather than a remote URL, plus genuine native
   integration (push, native share, native Google/Apple sign-in, deep links). Do **not** ship the
   remote-URL mode.
2. **Guideline 4.8 — Sign in with Apple.** See §5. Blocking.
3. **Guideline 5.1.1(v) — account deletion, and Apple token revocation.** Apple requires in-app account
   deletion for any app with account creation, reachable without contacting support. Verify the settings
   flow does this on-device — it is `general-settings.tsx` → `DeleteAccountSurveyModal` → `me/delete`.

   The second half — an app offering Sign in with Apple must also **revoke the Apple refresh token**
   when the account is deleted, not merely delete its own rows — is now handled on the client:
   `revokeAppleToken()` in `web/lib/firebase/users.ts`, called from `deleteAccount()` immediately
   before `me/delete`. It no-ops for users with no `apple.com` provider. Two constraints shaped it:
   - Firebase can only revoke a refresh token it captured, and it captures one only if the **OAuth code
     flow configuration** (Team ID, Key ID, Sign in with Apple `.p8`) was filled in _before_ that user
     signed in — see §5.2. A user who signs in while it is blank can never have their token revoked, so
     that console step must be done before the first TestFlight build, not before submission.
   - `revokeAccessToken()` needs a freshly re-authenticated credential, so `revokeAppleToken()`
     re-authenticates first — one more Apple sheet on the way out, which is Apple's design. That also
     forces it client-side: `backend/api/src/delete-me.ts` has no way to do it.

   **Failure is swallowed, deliberately.** 5.1.1(v) requires that deleting an account actually works,
   so an unreachable Apple must not trap someone in an undeletable account. The outcome is logged and
   tracked (`delete account apple revocation`) rather than thrown.

4. **Guideline 1.2 / 1.1.6 — UGC on a dating-adjacent app.** Expect scrutiny: they will want a report
   mechanism, a block mechanism, a published moderation policy, and a terms-of-service acceptance at
   signup. All four exist: report and block on the ⋮ menu of any profile (report also inside a
   conversation), "Community standards" and "Safety tools, moderation, and holds" in
   `web/public/md/terms.md`, and an explicit consent checkbox at `/register`.

   Blocking was, until recently, mostly cosmetic — it refused _new_ message channels and profile
   comments and nothing else, while the toast promised "You'll no longer see content from this user".
   It now also refuses messages in channels that already exist (the case blocking is actually for),
   removes the profile from search in both directions, and turns an existing conversation read-only
   while leaving it readable so it can still be reported. Enforcement is symmetric and server-side in
   `backend/api/src/helpers/blocks.ts`; the client half is `isBlocked` in `web/hooks/use-user.ts`.

   **One gap remains:** comments already posted by a blocked user still render, in both profile and
   proposal threads. `blockedUserIdSet` exists for it and is not yet wired in — a reviewer who blocks
   someone and then finds their comments still on a profile has found the same broken-promise problem
   the toast used to have.

5. **Age rating.** A connections app rates 17+/18+; set it honestly or risk removal.

   Related, and easy to get wrong on the privacy form: `@capgo/capacitor-social-login` declares
   `FBSDKCoreKit` and `FBSDKLoginKit` as hard pod dependencies, so **the Facebook SDK is compiled into
   the binary** even though we never call Facebook login (`SocialLogin.initialize` only ever configures
   `google` and `apple`). It is inert at runtime without a Facebook App ID, but it is present, it
   carries its own privacy manifest, and the App Privacy answers should be checked against what is
   actually in the bundle rather than what the app calls.

6. **Guideline 3.1.1 — in-app purchase.** If anything paid is ever added, iOS must route it through IAP
   (30%/15%). Not an issue today; a reason not to add web-only checkout links to the iOS build later.
7. **Demo account.** Review needs working credentials in App Review notes, since the app is gated behind
   login. Prepare a seeded account with a populated profile.
8. **ITMS-90129 — bundle display name already taken.** Hit on build 1. `CFBundleDisplayName` was
   `Compass`, which another App Store app already owns; App Store Connect rejects the _upload_, well
   before any human review, and the mail arrives minutes after a run that fastlane reported as a
   success. It is now `Compass Meet`, matching `compassmeet.com`.

   Worth knowing what this check does and does not cover: the **App Store name**
   ("Compass: Social Connections") was accepted when the app record was created, and the **bundle id**
   is unrelated. Only the home-screen label collided. Android's `app_name` stays `Compass` — Play has
   no such constraint, and renaming it would rename the app for existing installs for no benefit.

---

## 9. Order of work

Steps 1–4, 7 and the code half of 6 and 9 are done — see [§0](#0-status). What remains, in order:

1. ~~Rename `isAndroidApp` → `isNativeApp`, `android-push.ts` → `native-push.ts`; branch on
   `Capacitor.getPlatform()`.~~ Done.
2. ~~Move deep-link and notification-tap handling onto `@capacitor/app` +
   `pushNotificationActionPerformed`.~~ Done.
3. ~~Add the `apns` block to `sendPushToToken`.~~ Done — harmless on Android, prerequisite for iOS.
4. ~~`npx cap add ios`.~~ Done. The Simulator was never used — TestFlight over the air was the way builds
   reached the phone, and the Simulator cannot obtain an APNs token anyway (step 9).
5. Apple Developer Program, App ID with the three capabilities, App Store Connect app record.
6. ~~Firebase iOS app; Google iOS OAuth client.~~ Done. Left: the APNs `.p8` key and the Apple provider
   in Firebase Auth (§5.2), both of which need the membership from step 5.
7. ~~Universal Links file + `headers()` rule.~~ Done — only `APPLE_TEAM_ID` (the last placeholder,
   §0) and the Associated Domains toggle on the App ID are left.
8. GitHub secrets, then the `iOS Certificates (one-off)` workflow to seed the match repo, then the
   first TestFlight build; internal testing on the iPhone 11.
9. Verify push end-to-end on the **physical device** — the Simulator has no APNs token, so this step
   cannot be faked — then the rest of the on-device checklist
   in [§0](#to-do--needs-the-apple-consoles-or-the-phone).
10. App Store Connect metadata and first submission.

Since we develop on Linux ([§2.1](#21-working-without-a-mac)), CI replaced the Simulator as the way to get a
build onto the phone: get the fastlane half of step 8 standing early, then do 9 against TestFlight builds
with `ios-webkit-debug-proxy` attached over cable. The Xcode-GUI-only items that were supposed to force an
EC2 Mac day — the capability toggles for §4.1, §5 and §6 — were portal pages all along, and seeding the match
repo is the `iOS Certificates (one-off)` workflow on a GitHub `macos-15` runner. The Mac day never happened,
and steps 1–10 completed without one.

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
