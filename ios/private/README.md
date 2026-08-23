# ios/private

Local-only home for the Apple `.p8` keys. **Everything in this directory except this file is
gitignored**, and a global `*.p8` rule in the repo-root `.gitignore` is the second line of defence.

Nothing in the build reads from here. It exists so the three keys have one predictable place during
the console setup and any local `fastlane` run, instead of being scattered across `~/Downloads`.
The keys themselves belong in a password manager — Apple lets you download each one exactly once.

| File                     | What it is                        | Where it actually goes                                  |
| ------------------------ | --------------------------------- | ------------------------------------------------------- |
| `AuthKey_<KEYID>.p8`     | APNs auth key                     | Firebase → Project settings → Cloud Messaging (upload)  |
| `AuthKey_<KEYID>.p8`     | Sign in with Apple key            | Firebase → Authentication → Apple → OAuth code flow     |
| `AuthKey_<KEYID>.p8`     | App Store Connect API key         | `APP_STORE_CONNECT_KEY_P8` GitHub secret, base64'd      |

Apple names all three `AuthKey_<KEYID>.p8`, which is unhelpfully uniform — rename them on arrival, e.g.
`apns-<KEYID>.p8`, `signin-apple-<KEYID>.p8`, `asc-<KEYID>.p8`.

Only the third is ever consumed by code: the CI workflow decodes it from the secret. The first two are
uploaded to Firebase through the browser and never read locally, so once they are in Firebase and your
password manager, the copies here are just convenience.

```bash
base64 -w0 ios/private/asc-<KEYID>.p8      # -> APP_STORE_CONNECT_KEY_P8
```

The Key IDs and Team ID are identifiers rather than secrets, but they are only useful next to a key —
keep them with it. Team ID is `HFZVH8XR59` and is already in the repo-root `.env` for fastlane.
