#!/usr/bin/env node
/**
 * Patches `@capgo/capacitor-social-login` to present Google's sign-in from a view controller that can
 * actually present it.
 *
 * `GoogleProvider.swift` picks its presenter with:
 *
 *   UIApplication.shared.windows.first?.rootViewController
 *
 * `UIApplication.shared.windows` is deprecated since iOS 15, spans every connected scene, includes
 * system-owned windows, and its order is not contractual — so `.first` is a guess at which window
 * belongs to the app. GIDSignIn hands that controller to AppAuth, which derives its
 * `ASWebAuthenticationSession` anchor from `presentingViewController.view.window`. When the guess is
 * wrong the session refuses to start, and AppAuth reports the refusal as the thoroughly misleading
 * "Unable to open Safari." (`OIDAuthorizationService.m:83`).
 *
 * Evidence this is real, rather than the tidy-looking theory it was the first time round: build 16
 * sets `forcePrompt: true`, which stops the provider taking the silent `restorePreviousSignIn` branch
 * at line 80 and makes it actually present for the first time. Sentry then caught a *first* tap on a
 * freshly loaded `/signin` — no prior attempt, no focused text field, nothing presented — failing with
 * exactly that string. Before `forcePrompt`, Google never presented at all on a returning device, so
 * the bug could not show itself.
 *
 * The replacement asks the two questions the original meant to ask: which window is actually key, and
 * what is topmost on it. The `presentedViewController` walk matters because presenting from a
 * controller that is already presenting something fails, and the original never looked.
 *
 * Deliberately does **not** touch `AppleProvider.swift`, which resolves an anchor the same careless
 * way and gets away with it: it hands `ASAuthorizationController` a window rather than a controller,
 * and the Apple sheet is confirmed working on device. Its `windows.first!` is still a latent crash if
 * that array is ever empty — recorded in docs/ios.md §8.11, not fixed here. One provider is broken;
 * only one gets changed the week of a submission.
 *
 * Idempotent, and exits non-zero if upstream's source stops matching rather than silently shipping
 * unpatched. Drop this once upstream fixes it.
 */
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const FILE = join(
  import.meta.dirname,
  '..',
  'node_modules/@capgo/capacitor-social-login/ios/Sources/SocialLoginPlugin/GoogleProvider.swift',
)

const FROM = 'guard let presentingVc = UIApplication.shared.windows.first?.rootViewController else {'
const TO = `guard let presentingVc = { () -> UIViewController? in
                    let window = UIApplication.shared.connectedScenes
                        .compactMap({ $0 as? UIWindowScene })
                        .flatMap({ $0.windows })
                        .first(where: { $0.isKeyWindow })
                        ?? UIApplication.shared.windows.first
                    var vc = window?.rootViewController
                    while let presented = vc?.presentedViewController { vc = presented }
                    return vc
                }() else {`

const before = readFileSync(FILE, 'utf8')
if (before.includes('$0.isKeyWindow')) {
  console.log('google presenting-vc patch already applied')
  process.exit(0)
}
const found = before.split(FROM).length - 1
if (found !== 1) {
  console.error(
    `patch_google_presenting_vc: expected 1 occurrence of the presenter lookup in GoogleProvider.swift, ` +
      `found ${found}. Upstream's source has changed — re-check the patch before shipping.`,
  )
  process.exit(1)
}
writeFileSync(FILE, before.replace(FROM, TO))
console.log('google presenting-vc patch applied')
