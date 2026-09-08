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

### Reconciling a split

Reconciled at `1.44.0`: root `package.json` had sat at `1.15.0` while both mobile shells reached
`1.43.0`, so converging meant bringing the root up. The mobile numbers could not come down — Apple
requires `CFBundleShortVersionString` to increase across App Store releases — and the one-off cost was
a gap in the tag history (`1.15.0` → `1.44.0`), which is cosmetic.

Should they drift again, the same rule applies, and `scripts/bump-version.sh` applies it for you: it
derives the next version from the _highest_ of the three, never the root alone.

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

### Bumping the version

```bash
yarn bump              # minor step everywhere (1.44.0 -> 1.45.0), plus one on each build counter
yarn bump --dry-run    # print the five numbers it would change, write nothing
yarn bump 2.0.0        # bump to an explicit version instead of the next minor
```

`scripts/bump-version.sh` writes all five numbers a release moves: `version` in root `package.json`,
`versionName` + `versionCode` in `android/app/build.gradle`, and `MARKETING_VERSION` +
`CURRENT_PROJECT_VERSION` in `project.pbxproj` (both build configurations of each). The version is one
minor step up from the highest of the three currently on disk; the two counters advance by one from
their own current values, independently, because they are not shared.

It edits files and stops there — no commit, no tag, no push. It refuses a version that is not higher
than what is already on disk, since both stores reject an upload that goes backwards, and it reads
every number back after writing rather than trusting the substitutions: a regex that quietly matched
nothing is the silent half-bump the script exists to prevent. It also warns when `CHANGELOG.md` has no
entry for the new version, because `scripts/release.sh` would then fall back to `--generate-notes` and
that fallback is what `/news` would show.

Write the `CHANGELOG.md` entry first, then bump, then push — the entry has to name the version that
ends up in root `package.json`.

### What each push triggers

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

### Promoting to production by hand

CI stops at Play's internal track and at TestFlight. Promoting either to production is a console step,
and both consoles ask for release notes there — which is why each `CHANGELOG.md` entry ends with a
ready-to-paste block, written with the entry rather than improvised in the console. It sits inside an
HTML comment, so it stays out of the GitHub release body and `/news`; copy it from the raw file.

1. **Play Console** — _Release > Production > Create new release_, promote the internal build, then
   paste the whole tagged block into _Release notes_:

   ```
   <en-US>
   ...
   </en-US>
   <fr-FR>
   ...
   </fr-FR>
   ```

   500 characters per language, tags excluded. Locales with no block of their own (`de` today) fall
   back to `en-US`.

2. **App Store Connect** — _App Store > iOS App > + Version_, pick the TestFlight build, then fill
   _What's New in This Version_ once per localisation (English (U.S.), French). No tags there: paste
   the text inside each pair of tags into its own field. 4000-character limit.

Same copy on both stores unless a change is genuinely platform-specific, and **no price references** —
"free", "no subscriptions", "donations", any figure. Guideline 2.3.7 exempts the description only; see
[`app-store-listing.md`](app-store-listing.md) for the 1.42.0 rejection that made the point.
