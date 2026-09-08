# Versioning and releases

One product, three shells, and — as of August 2026 — **one version number across all of them**.

## The three places a version lives

| Where                                   | Field               | What it drives                                                                                                                                                                    |
| --------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` (repo root)              | `version`           | `scripts/release.sh` tags from it, cuts the GitHub release, and pulls that version's `CHANGELOG.md` entry as the body — which is what `/news`, Discord and Mastodon then announce |
| `android/app/build.gradle`              | `versionName`       | The version users see in Play                                                                                                                                                     |
| `ios/App/App.xcodeproj/project.pbxproj` | `MARKETING_VERSION` | The version users see in the App Store (`CFBundleShortVersionString`)                                                                                                             |

## The policy

**From the next release onward, all three move together.** A single number identifies one state of the
product everywhere: a bug report saying "1.43.0" pins the code without anyone having to ask which
platform, and the `CHANGELOG.md` entry for that version describes what shipped on all three.

This is more defensible here than in a typical multi-platform project. Android and iOS are Capacitor
shells around the _same_ `web/` static export, so the same version really is the same product code —
not three codebases that happen to release together.

### Reconciling the current split

They have drifted: root `package.json` is at `1.15.0` while both mobile shells are at `1.42.0`. The
mobile numbers cannot go backwards — Apple requires `CFBundleShortVersionString` to increase across App
Store releases — so converging means bringing the root up.

Do it at the next release: set root `package.json` to the mobile number and carry on from there. The
one-off cost is a gap in the tag history (`1.15.0` → `1.42.0`), which is cosmetic; the alternative is
permanently divorced numbering for a single codebase.

### What is _not_ synced

The per-store upload counters, and deliberately so:

- `versionCode` in `android/app/build.gradle` (past 160)
- `CURRENT_PROJECT_VERSION` in `project.pbxproj` (starts at 1)

They have separate histories, both stores require them to strictly increase per upload, and bumping one
is what triggers that platform's release workflow. Forcing them to match would mean inflating the iOS
counter by 160 for no reason and breaking the "bump = release" trigger. Leave them independent.

### When drift is fine

Treat sync as a convention, not an invariant. The stores do not ship in lockstep: Play publishes within
hours, App Review can hold or reject a build for days. If iOS 1.43.0 is stuck in review, ship Play
1.43.0 anyway rather than holding a fix hostage to Apple's queue, and re-converge at the next joint
release. Likewise a platform-specific hotfix can bump one shell alone.

The goal is that a version number is _meaningful_, not that the three are byte-identical at every
instant.

## Releasing

- **Web / GitHub release / announcements** — bump root `package.json`, push to `main`. `cd.yml` runs
  `scripts/release.sh`, which tags, creates the release from the `CHANGELOG.md` entry, then fans out to
  `cd-mastodon.yml` and `cd-discord.yml`.
- **Android** — bump `versionCode` (and `versionName`) in `android/app/build.gradle`, push to `main`;
  `cd-android.yml` builds the signed AAB and uploads to Play.
- **iOS** — bump `CURRENT_PROJECT_VERSION` (and `MARKETING_VERSION`) in `project.pbxproj`, push to
  `main`; `cd-ios.yml` builds on a `macos-15` runner and uploads to TestFlight. That runner is the only
  macOS in the pipeline — releasing iOS from a Linux box is just a commit. See
  [`../ios/README.md`](../ios/README.md) §4.

Every `CHANGELOG.md` entry must start with `## <version>` matching root `package.json` exactly — the
awk in `scripts/release.sh` parses on that boundary. See the header of `CHANGELOG.md` for the entry
format, including the `<!--tech-->` marker that `/news` splits on.
