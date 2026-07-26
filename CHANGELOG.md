# Changelog

Release notes for Compass. `scripts/release.sh` reads the entry for the version being tagged straight out
of this file and uses it as the GitHub release body (falls back to `gh release --generate-notes` if no
entry matches). That release body is what the [/news](/news) page reads, via the GitHub Releases API — so
an entry here only reaches users once its version is actually tagged and released.

Each entry:

- Starts with `## <version>` (must match `package.json`'s `version` exactly) and ends at the next `## `
  heading or a `---` separator line — `scripts/release.sh` parses on that boundary.
- Has two parts, in order:
  1. A **user-facing summary** — plain language, no internals. Shown by default on `/news`.
  2. A **technical details** section — implementation-level notes. Collapsed behind a "Show technical
     details" toggle on `/news`.
- Separates those two parts with an HTML comment, `<!--tech-->`, alone on its own line. That exact marker
  is what `web/pages/news.tsx` splits on. An entry without the marker (e.g. old releases before this
  convention) just renders as-is on `/news`, with no expandable section — keep that in mind while
  backfilling.

To edit an already-published release's notes to match this convention, use
`gh release edit <tag> --notes-file <(sed ...)` or paste manually in the GitHub UI — `scripts/release.sh`
only runs at tag-creation time, so it won't touch releases that already exist.

---

## 1.13.0 — 2026-07-27

### New features

- Voice messages: record, transcribe, and play back audio directly in profiles and chats
- Added a media creator tool for building profile photos/videos in-app
- Added a searchable FAQ page with categories and deep links to individual answers
- Signal is now a supported way to share contact info (phone number or signal.me link)
- Finnish added to the list of profile languages
- Sexual orientation is now its own profile field, with expanded gender options
- Added neurotype and other accessibility fields to profiles
- "Get Notified" button on saved searches — get alerted as soon as a new match appears
- Redesigned notifications: clearer settings and empty states explaining what triggers an alert

### Improvements

- Redesigned the About page with growth stats and clearer help cards
- Redesigned the sidebar for better accessibility and visual hierarchy
- Saved profiles are now called "bookmarks" instead of "stars" throughout the app
- Added a lightbox for viewing a profile's pinned photos/videos
- Nudge to keep your account (instead of deleting it) when matches are scarce
- Customizable share icon and a targeted share sheet for sending profiles to friends
- Hint to help you center your face when uploading a profile picture
- Tidied up filter labels; moved "relationship style", "raised in", and "causes" into clearer sections
- Refined numeric-range and diet filters to handle edge cases better
- Added a world map and demographic breakdowns to the `/stats` page

### Trust & safety

- Added a spam guard that limits new conversations per day and auto-bans abusers
- Banned and disabled profiles no longer appear in search results
- Added limitations for accounts flagged as suspicious
- Added the ability to report a message channel

<!--tech-->

### Backend & API

- `compute-scores`: delete invalid compatibility-score rows instead of nulling them; exclude null scores
  when ordering profiles, with test coverage
- `searchUsers`: exclude banned users and disabled profiles at the query level when `excludeUnavailable` is
  set, with unit tests
- Hardened SQL across notification settings, private messages, and GeoDB API requests (input sanitization,
  stricter limit validation)
- `content_owner_id` made nullable on `reports`; removed the outdated "self update" policy on `profiles`
- Added `getChannelsCount` API endpoint
- Refactored profile column retrieval for better caching
- API version bumped 1.40.0 → 1.50.0 across the range

### Android

- Declared microphone permissions and runtime permission handling for voice recording
- Added a custom icon/color for FCM push notifications
- Added `MEDIA_SOURCE_BASE_URL` to the CD build environment
- Bumped `compileSdkVersion`/`targetSdkVersion` to 36; app version bumped through 1.31.1 (versionCode 133)

### Testing

- Restructured the Playwright E2E suite around a POM/Fixture app-class pattern
- Added a multi-account context manager for tests that need several accounts interacting at once
- Added coverage for messaging, profile hiding/bookmarking, filters, onboarding, compatibility questions,
  and Google-account sign-in
- Added DB seeding and account-cleanup helpers for test isolation

### Performance

- Reduced excessive re-renders in the rich-text editor; editor max-height is now computed dynamically
- Added loading skeletons and avoided redundant refetches on the profiles grid

### Tooling & docs

- Added scripts for OG/social-preview card rendering, AI-generated showcase portraits, vote-tally capture,
  and demo/tour video generation (Remotion)
- Vote-tally images switched to PNG; dropped the narrow and WebP variants
- Added `.env.local` override support to `run_local.sh`; added dev DB/Firebase reset commands
- Added F-Droid publishing documentation and a React/TypeScript fundamentals guide; added `CLAUDE.md` to
  several sub-packages

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.12.0...1.13.0

---

<!-- Backfill older releases above this line, following the same two-section pattern and marker described at the top of this file. -->
