# Versioning and releases

One product, three shells, and — as of August 2026 — **one version number across all of them**.

## The three places a version lives

| Where                                   | Field               | What it drives                                                                                                                                                                                                                                                                |
| --------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` (repo root)              | `version`           | `scripts/release.sh` tags from it and cuts the GitHub release, using that version's `CHANGELOG.md` entry as the body — which is what `/news`, Discord and Mastodon then announce. No entry, no release: between releases this number is the _next_ version, not a shipped one |
| `android/app/build.gradle`              | `versionName`       | The version users see in Play                                                                                                                                                                                                                                                 |
| `ios/App/App.xcodeproj/project.pbxproj` | `MARKETING_VERSION` | The version users see in the App Store (`CFBundleShortVersionString`)                                                                                                                                                                                                         |

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
counter by 160 for no reason and breaking the "bump = build" trigger. Leave them independent.

They also move at a different _moment_ from the version — see
[Between releases: dev builds](#between-releases-dev-builds) — which is why `yarn bump` and
`yarn bump:build` are two commands.

### When drift is fine

Treat sync as a convention, not an invariant. The stores do not ship in lockstep: Play publishes within
hours, App Review can hold or reject a build for days. If iOS 1.43.0 is stuck in review, ship Play
1.43.0 anyway rather than holding a fix hostage to Apple's queue, and re-converge at the next joint
release. Likewise a platform-specific hotfix can bump one shell alone.

The goal is that a version number is _meaningful_, not that the three are byte-identical at every
instant.

## Releasing

`main` carries the **next, unreleased version** for the whole development window. The version number is
not what says "ship this" — the `CHANGELOG.md` entry is. That split is what makes interim dev builds
possible; see [Between releases: dev builds](#between-releases-dev-builds) for why Apple forces it.

### The cycle

1. **Develop** on the open version (say `1.45.0`, already on `main` from the end of the previous
   release). Every dev build in this window is `yarn bump:build` — counters only.
2. **Release**: write the `## 1.45.0` entry in `CHANGELOG.md` and push it to `main`. That push is the
   release: `cd.yml` runs `scripts/release.sh`, which tags `1.45.0`, creates the GitHub release from
   the entry, and fans out to Mastodon and Discord. Ship the final build with `yarn bump:build` in the
   same push if the last dev build isn't the one you want to promote.
3. **Promote** in the Play and App Store Connect consoles by hand (below).
4. **Open the next version**: `yarn bump` → `1.46.0` everywhere, push. Nothing builds and nothing is
   announced. Do this promptly — until it lands, no further dev build can go to TestFlight.

### Bumping the version

```bash
yarn bump              # open the next version everywhere (1.45.0 -> 1.46.0). No counter moves.
yarn bump 2.0.0        # open an explicit version instead of the next minor
yarn bump:build        # advance both store build counters, leave the version alone
yarn bump --dry-run    # print the five numbers, write nothing (works with --build too)
```

`scripts/bump-version.sh` owns all five numbers a release touches: `version` in root `package.json`,
`versionName` + `versionCode` in `android/app/build.gradle`, and `MARKETING_VERSION` +
`CURRENT_PROJECT_VERSION` in `project.pbxproj` (both build configurations of each). `yarn bump` moves
the three versions, one minor step up from the highest currently on disk; `yarn bump:build` moves the
two counters, each one step up from its own value, independently, because they are not shared.

Neither one commits, tags or pushes. `yarn bump` refuses a version that is not higher than what is
already on disk, since both stores reject an upload that goes backwards, and both modes read every
number back after writing rather than trusting the substitutions: a regex that quietly matched nothing
is the silent half-bump the script exists to prevent. Each mode also warns about the mistake it is
positioned to catch — `yarn bump` when the version being left behind has no `CHANGELOG.md` entry (it
was never released, and bumping past it strands it), `yarn bump:build` when the current version is
already tagged (its TestFlight train may be closed).

### Between releases: dev builds

Apple groups TestFlight builds into pre-release _trains_ keyed on `CFBundleShortVersionString`
(`MARKETING_VERSION`). **A train closes permanently the moment that version is released on the App
Store.** Uploading another build against it fails validation at the end of a full `cd-ios.yml` run:

```
The train version '1.44.0' is closed for new build submissions
CFBundleShortVersionString [1.44.0] ... must contain a higher version than the previously approved version [1.44.0]
```

So a dev build between releases carries the **next** version, never the one just shipped — which is
what step 4 above sets up. In the open window a dev build is:

```bash
yarn bump:build   # e.g. android 179, ios 25, both still on 1.45.0
```

and TestFlight stacks `1.45.0 (24)`, `1.45.0 (25)`, … until the version is released.

Play has no equivalent constraint — `versionName` is a free string and only `versionCode` has to
increase — so this rule is Apple's alone, but the counters move together anyway to keep one number
across both stores.

### What each push triggers

- **GitHub release / announcements** — land the `## <version>` entry in `CHANGELOG.md` on `main`.
  `cd.yml` runs `scripts/release.sh`, which tags, creates the release from that entry, then fans out to
  `cd-mastodon.yml` and `cd-discord.yml`. A version with no entry is skipped without a tag, which is
  what lets the version bump in step 4 be a silent no-op.
- **Web** — any push to `main`; Vercel deploys it. Not tied to the version number at all.
- **Android** — raise `versionCode` in `android/app/build.gradle`, push to `main`; `cd-android.yml`
  builds the signed AAB and uploads to Play. `cd-android.yml` skips unless the counter actually went
  up, so a version-only bump ships nothing.
- **iOS** — raise `CURRENT_PROJECT_VERSION` in `project.pbxproj`, push to `main`; `cd-ios.yml` builds
  on a `macos-15` runner and uploads to TestFlight, under whatever `MARKETING_VERSION` is on disk. Same
  counter gate as Android. That runner is the only macOS in the pipeline — releasing iOS from a Linux
  box is just a commit. See [`../ios/README.md`](../ios/README.md) §4.

Every `CHANGELOG.md` entry must start with `## <version>` matching root `package.json` exactly — the
awk in `scripts/release.sh` parses on that boundary, and a mismatch now means no release at all rather
than a release with generated notes. See the header of `CHANGELOG.md` for the entry format, including
the `<!--tech-->` marker that `/news` splits on.

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
