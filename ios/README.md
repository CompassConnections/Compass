# Compass iOS WebView App

Capacitor wrapper that loads the Next.js static export into a WKWebView — the same shell as
[`../android`](../android/README.md), the same web bundle, no second UI codebase.

The plan and the reasoning behind it live in [`../docs/ios.md`](../docs/ios.md). This file is the
operational half: how to build, sign and ship, and what still has to be done by hand on a Mac.

---

## 1. Layout

```
ios/
├── App/
│   ├── App.xcworkspace          ← open this, not the .xcodeproj (CocoaPods)
│   ├── App.xcodeproj/project.pbxproj   MARKETING_VERSION + CURRENT_PROJECT_VERSION live here
│   ├── Podfile                  Capacitor plugin pods + FirebaseMessaging
│   └── App/
│       ├── AppDelegate.swift    Firebase init + APNs→FCM token bridge
│       ├── Info.plist           Usage strings, URL schemes, ATS, background modes
│       ├── App.entitlements     Push, Associated Domains, Sign in with Apple
│       ├── Assets.xcassets      Regenerated from assets/icon.png; PNGs are gitignored
│       └── public/              The synced web build (gitignored)
├── fastlane/                    Appfile / Matchfile / Fastfile — the release pipeline
└── Gemfile                      fastlane + cocoapods
```

`GoogleService-Info.plist` is **not** committed (mirroring `android/app/google-services.json`). CI
writes it from the `IOS_GOOGLE_SERVICES_PLIST` secret; for a local build, download it from the
Firebase console → Project settings → iOS app and drop it in `ios/App/App/`.

## 2. Two run modes

- **Local-asset mode (default)** — the app ships the synced web build and loads it from the bundle.
  This is what releases use, and what keeps us out of App Store guideline 4.2 ("repackaged website").
- **Dev mode** — the app loads `http://localhost:3000` (Simulator) or your LAN IP (real device) so
  changes to `/web` show up without a rebuild:
  ```bash
  export NEXT_PUBLIC_LOCAL_IOS=1            # Simulator
  export NEXT_PUBLIC_WEBVIEW_DEV_PHONE=1    # a real iPhone instead; set NEXT_PUBLIC_DEV_LAN_IP too
  yarn sync-ios
  yarn dev
  ```
  Cleartext HTTP works because `Info.plist` carries `NSAllowsLocalNetworking` — private-network HTTP
  only, never the blanket `NSAllowsArbitraryLoads` that App Review rejects.

  Do not set `NEXT_PUBLIC_LOCAL_ANDROID` at the same time: `capacitor.config.ts` has a single
  `server.url` shared by both platforms, and whichever var is set at sync time wins.

## 3. Building

From the repo root — works on Linux for everything except the archive:

```bash
yarn build-sync-ios      # build the web export, cap sync ios, regenerate icons
```

Then on macOS:

```bash
cd ios/App && bundle exec pod install
npx cap open ios         # opens App.xcworkspace; Product → Run / Product → Archive
```

## 4. Releasing

Push to `main` with a bumped `CURRENT_PROJECT_VERSION` in `App/App.xcodeproj/project.pbxproj` and
[`.github/workflows/cd-ios.yml`](../.github/workflows/cd-ios.yml) builds a signed binary on a
`macos-15` runner and uploads it to TestFlight. Exactly the Android flow, with
`CURRENT_PROJECT_VERSION` playing the part of `versionCode`.

Keep `MARKETING_VERSION` in step with `versionName` in `android/app/build.gradle` **and** with `version`
in the repo-root `package.json`, which is what tags the GitHub release and the changelog entry — one
number for the whole product. The policy and how to reconcile the current split live in
[`../docs/releases.md`](../docs/releases.md). Both shells wrap the same web bundle, so the number genuinely describes
identical product code — a bug report saying "1.42.0" identifies the code without needing the platform.

Treat that as a convention rather than an invariant. The stores do not ship in lockstep: Play publishes
in hours, App Review can hold or bounce a build for days. When that happens, let the numbers drift
rather than holding a Play release hostage to Apple's queue, and re-converge at the next joint release.

Only the *marketing* version is worth syncing. `CURRENT_PROJECT_VERSION` and Android's `versionCode`
are per-store upload counters with separate histories — iOS is at 1 while Android is past 160 — and both
must strictly increase per upload. Forcing those to match would be actively harmful.

Locally (on a Mac with the secrets in the environment):

```bash
cd ios && bundle exec fastlane beta
cd ios && bundle exec fastlane restore   # undo the in-place entitlement/signing edits `beta` makes
```

### Secrets the workflow needs

| Secret                          | What it is                                                      |
| ------------------------------- | --------------------------------------------------------------- |
| `APPLE_TEAM_ID`                 | 10-character team id from developer.apple.com → Membership       |
| `APP_STORE_CONNECT_KEY_ID`      | App Store Connect → Users and Access → Integrations → App Store Connect API (see note) |
| `APP_STORE_CONNECT_ISSUER_ID`   | Same page, above the key list                                    |
| `APP_STORE_CONNECT_KEY_P8`      | The downloaded `.p8`, base64'd (`base64 -w0 AuthKey_XXX.p8`)     |
| `MATCH_GIT_URL`                 | Private repo holding the encrypted certs/profiles                |
| `MATCH_PASSWORD`                | Passphrase `match` encrypts that repo with                       |
| `MATCH_GIT_BASIC_AUTHORIZATION` | `printf '%s' "<user>:<PAT>" \| base64 -w0` — no here-string, see below |
| `IOS_GOOGLE_SERVICES_PLIST`     | `base64 -w0 GoogleService-Info.plist`                            |

Use `printf '%s' ... | base64 -w0` for the basic-auth value, **not** `base64 -w0 <<< "..."`: a bash
here-string appends a newline, so the decoded credential becomes `user:PAT\n` and git can reject the
malformed `Authorization` header. The other rows encode files, where the trailing byte is part of the
file and harmless.

The App Store Connect API is disabled on a new team: the Integrations page shows only a **Request
Access** button. The Account Holder clicking it enables the section immediately — there is no approval
queue, despite the "on behalf of your organization" wording.

Generate a **Team Key** (not an Individual Key — those cannot manage certificates) with the **Admin**
role. App Manager suffices for `pilot`, but `match` creates the distribution certificate and profile on
its first non-`readonly` run and that needs Admin. The **Issuer ID** sits above the key list rather than
on the key row, and is easy to miss. The `.p8` downloads once; keep it in `ios/private/`.

The key exists instead of an Apple ID because it carries no 2FA session — which is what lets CI run
unattended. `fastlane/Appfile` leaves `apple_id` and `itc_team_id` unset for the same reason.

### Seeding the certificate repo

Run the **`iOS Certificates (one-off)`** workflow from the Actions tab, typing `create-certificates`
into the confirmation box. That is the whole procedure. It runs
[`.github/workflows/ios-certs.yml`](../.github/workflows/ios-certs.yml) on a `macos-15` runner, which
executes the `certs` lane, and needs seven of the eight secrets below to already be set.

Then **check the certs repo has commits on `master`** before going any further. That check is what
distinguishes "the certificate exists and is usable" from the failure mode described below.

Run it once, ever. Apple issues a team three distribution certificates; re-running where match cannot
see the existing one creates another and eventually exhausts them.

#### Why not from a laptop

Creating certificates needs macOS, and the way it fails on Linux is expensive rather than obvious.

`match` runs fine on Linux right up to the end: it clones the repo, decrypts it, asks App Store Connect
for a certificate, and creates a provisioning profile. It then tries to *install* that profile and dies
with `Unable to locate Xcode`. Note that it skips the equivalent certificate steps cleanly —
`Skipping importing certificates as it would not work on this operating system` — so the missing OS
guard on profile installation is a gap in fastlane, not something configuration can route around.

The cost is that the crash lands **after** Apple has issued the certificate and **before** anything is
encrypted and pushed. The result is a certificate occupying one of the three slots whose private key
existed only in a temp directory that is now gone. Recovery is to revoke it on developer.apple.com and
start again. This happened once already — certificate `YH42WN38ZM`, since revoked — and the workflow
above exists so it does not happen twice.

Reading is a different matter — `match` decrypts perfectly well on Linux, which is all any release run
does, since `Matchfile` forces `readonly` whenever `CI` is set.

#### Running the lane by hand

Only useful on macOS, or for debugging the lane itself:

```bash
sudo apt install ruby-dev    # NOT optional: seven of fastlane's gems build native extensions
gem install bundler --user-install

cd ios
bundle config set --local path vendor/bundle   # project-local; never `sudo bundle install`
bundle install

set -a; source ../.env; set +a                 # fastlane does NOT read the repo-root .env itself
bundle exec fastlane certs
```

Three traps, each of which looks like something else when you hit it:

- **`fastlane/Matchfile` is already committed, so `match init` is not the command.** It only generates
  a Matchfile, and would overwrite ours.
- **Use the `certs` lane, not `fastlane match appstore`.** The bare command invokes the match *action*
  from the CLI, which never loads the `Fastfile` — so it gets no App Store Connect API key and stops to
  prompt for an Apple ID and 2FA code. The lane wires the key in, and passes `readonly: false`
  explicitly because CI runners export `CI=true`, which would otherwise make the lane a silent no-op.
- **fastlane's dotenv only looks in `fastlane/.env` and the directory holding `fastlane/`** (i.e.
  `ios/.env`), never the repo root. Source the repo-root `.env` explicitly as above, or the lane dies
  on `ENV.fetch("APP_STORE_CONNECT_KEY_ID")`.

Ubuntu's `ruby` package omits the headers, so without `ruby-dev` the install dies on `bigdecimal`,
`json`, `nkf`, `digest-crc`, `erb`, `prism` and `io-console` with `mkmf.rb can't find header files for
ruby`. Reaching for `sudo` does not help — the headers are still missing, and the gems land in
`/var/lib/gems` as root, which is what bundler's warning is about. `vendor/bundle` is gitignored.

## 5. Debugging from Linux

The one thing usually assumed to need a Mac and doesn't. With the iPhone on USB:

```bash
sudo apt install libimobiledevice-utils ideviceinstaller

idevice_id -l                 # UDID — also what you register in the Apple dev portal
idevicesyslog | grep -i compass   # native + Capacitor plugin logs (NOT WebView console.log)
idevicecrashreport -e /tmp/crashes   # pull .ips crash reports; symbolicate on the CI runner
```

For the JS console, DOM and network — which is most of what matters in a WebView app — enable
Settings → Safari → Advanced → Web Inspector on the phone, then:

```bash
ios_webkit_debug_proxy                       # then, in another terminal:
node ios/scripts/webview-eval.mjs "location.href"
node ios/scripts/webview-eval.mjs "Object.keys(Capacitor.Plugins).join(',')"
```

`webview-eval.mjs` runs JavaScript in the WebView straight from the shell, which on Linux is far less
trouble than the DevTools UI: the documented route is a `chrome-devtools://` URL, and current Chrome
refuses to open that scheme from a link *or* the omnibox (it searches Google for it instead), while
Firefox cannot open it at all. The script header documents the two protocol quirks it works around —
commands must be wrapped in `Target.sendMessageToTarget`, and `awaitPromise` is unsupported, so use
synchronous `XMLHttpRequest` or stash a result on `window` and read it back.

If you do want the full UI: open `http://localhost:9222` in **Chrome**, right-click the
`capacitor://localhost` entry, Copy Link Address, and paste it into the address bar.

**A TestFlight build is not inspectable by default.** Capacitor sets `webView.isInspectable` only
under `#if DEBUG`, and TestFlight ships Release — so the device advertises no inspectable page and the
proxy's listing (`http://localhost:9222`) comes back empty, which reads as a broken proxy rather than a
locked-down WebView. If you then run JS in that empty listing page's console you are talking to the
proxy's own HTTP server, and every `fetch` 404s.

`cd-ios.yml` currently sets `IOS_WEB_DEBUG: '1'` at the workflow level, so **every** build is
inspectable; `capacitor.config.ts` turns that into `ios.webContentsDebuggingEnabled`. Locally, put
`IOS_WEB_DEBUG=1` in the repo-root `.env` before `yarn sync-ios`.

It is a constant rather than a `workflow_dispatch` input on purpose: a push that bumps
`CURRENT_PROJECT_VERSION` already triggers a build, so a manual run afterwards would reuse that build
number and Apple rejects the duplicate on upload. One build per number, one setting for both paths.

**Set it back to `''` before submitting** — it lets anyone holding the device open a console on the
app, and nothing fails if it is left on. Tracked in [`../docs/ios.md`](../docs/ios.md) §0.

**`ios-webkit-debug-proxy` is not in the Ubuntu archive** (`E: Unable to locate package`) — it has to be
built from source. The build tools are the usual ones; the two libraries are not installed by default:

```bash
sudo apt install libimobiledevice-dev libplist-dev   # plus build-essential autoconf automake libtool
git clone https://github.com/google/ios-webkit-debug-proxy.git /tmp/iwdp
cd /tmp/iwdp && ./autogen.sh && make && sudo make install && sudo ldconfig
```

Both this and libimobiledevice are community reimplementations of Apple's protocols and are picky about
iOS/tool version pairings. Ubuntu ships libimobiledevice 1.3.0 (2020), which predates iOS 17 — if
`idevice_id -l` sees the phone but `ios_webkit_debug_proxy` cannot attach to the WKWebView, build
libimobiledevice from git master too rather than debugging the packaged one. Budget an afternoon the
first time; this is the least reliable link in the Linux workflow.

## 6. What still needs a Mac

Everything above except `xcodebuild`/Archive runs on Linux, and the release path is CI. A real
interactive macOS session is needed for:

- the one-time Apple Developer setup done through Xcode's UI (capability toggles that must match
  `App.entitlements`),
- the first App Store Connect submission and its metadata,
- crash symbolication, if you'd rather not use the `symbolicate` fastlane lane on the runner.

See [`../docs/ios.md`](../docs/ios.md) §2.1 for how to get that time on an AWS EC2 Mac instance.

## 7. Caveats

- Bundle id is `com.compassconnections.app` — same as Android, and it must match the Firebase iOS
  app, the App ID in the developer portal, and every provisioning profile.
- `aps-environment` in `App.entitlements` is `development`. The `beta` lane rewrites it to
  `production` before archiving; a TestFlight build carrying `development` registers against sandbox
  APNs and pushes silently never arrive.
- The Simulator cannot obtain an APNs device token. Push can only be tested on hardware.
- `Info.plist` and `common/src/constants.ts` both carry the iOS Google OAuth client id, one reversed
  and one not. They must be changed together.
