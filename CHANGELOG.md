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

## 1.15.0 — 2026-08-17

### New features

- Testimonials: share your experience of Compass with a rating and a short write-up, browse everyone
  else's, and leave one on your way out if you delete your account
- Proposals are now discussions — comment for or against, reply to others, edit your comment (with its
  history kept), and get notified when someone responds. The strongest arguments on each side surface at
  the top
- Spotlight: the home page now features real members who opted in. Turn it on or off any time in settings
- Search alerts: bookmark a search, get an email the moment a new member matches, and open the alert on
  its own page to see who's new
- Referrals page showing who joined through your link
- Fill your profile from an existing write-up: paste a Notion page or Firefly profile link and Compass
  drafts your answers from it
- Reorder your profile photos by dragging them or with arrow buttons, and duplicates of your profile
  picture are now prevented
- Footnotes in profiles and posts, with tooltip previews and smooth scrolling between marker and note
- Choose how the profile grid looks — masonry or uniform cards — from a new display-options button in the
  search toolbar
- Copy any chat message as plain text
- Choose whether your profile is public or members-only right in the sign-up form, and control separately
  whether it appears in Compass's public feeds
- Analytics are now opt-in: a consent banner on first visit and a toggle in settings

### Improvements

- Pressing Enter in a message now starts a new paragraph instead of sending — use the send button (or
  Ctrl/Cmd+Enter). Same behavior on desktop and mobile, so half-written messages don't fly off
- Profiles now store a birth date, so your age stays correct instead of going stale
- Conversations show when someone has left, instead of looking like an active chat with nobody in it
- Pasting formatted text (from Markdown or another document) keeps its structure instead of collapsing
  into one block
- Saved searches are easier to reuse: cleaner rows, and applying one restores both its filters and its
  location
- Vote buttons show which way you voted, with much better contrast and screen-reader support
- Redesigned the link preview card for profiles shared on social media
- Profile previews no longer repeat bio scaffolding like "About me" headings and status notes
- Privacy policy and terms of service are now available in French and German
- Reorganized profile sections: height moved to demographics, age and location swapped
- Clearer onboarding and compatibility copy, shorter share and welcome emails, and better username
  suggestions from your email
- Distances in miles are rounded, and US locations read more naturally
- Emails now mention how many members are near you
- Fixed a dropdown that closed before you could pick an option, a large gap under the Android header, and
  chat jumping when scrolling to the newest message
- Faster proposal pages and profile loading — fewer redundant lookups behind the scenes
- Removed the Reddit link from the social page (account suspended)

<!--tech-->

### Database

- New tables and migrations: `outreach_contacts`, `outreach_sends`, `search_alert_sends`, `testimonials`,
  `vote_comments` (+ stance extension, top-arguments ranking, edit history, nullable avatar),
  `profile_spotlights`, plus `feed_visibility` and `birth_date` columns on `profiles`
- `birth_date` replaces stored `age` — DB triggers derive and backfill age, with matching frontend
  validation and input handling
- Highlighted-argument ranking moved into SQL so list and detail views rank identically and comment
  payloads shrink

### Backend & API

- New endpoints: testimonials (create/get/moderate), vote comments (create/edit/mute/hide), spotlights
  (public/admin create/update), `get-search-alert`, `create-outreach-search`, `get-my-referrals`,
  `get-outreach-stats`, `send-city-number-emails`, `send-empty-room-emails`
- `llm-extract-profile` gained Notion (`fetchNotionRecordMap` → TipTap `JSONContent`) and Firefly
  (Supabase RPC, displayed fields only, quiz answers excluded) extraction paths, with unit tests
- Outreach system: admin interface, member queue, contact tracking, local-density and referral helpers;
  banned and disabled members excluded from the queue
- New-member profiles announced on Discord via `newMemberDiscordMessage`, with referrer attribution
- Batched creator lookups on vote pages and deduplicated concurrent `useProfileByUserId` requests
- API version 1.57.1 → 1.66.0

### Web

- Analytics consent (`web/lib/consent.ts`) gates Sentry and analytics init; markdown-backed doc pages
  (`markdown-doc.ts`, `doc-page.tsx`) now serve privacy/terms from `web/public/md/{,fr,de}`
- Added `build-sitemap.mjs`, `robots.txt` entries, and JSON-LD structured-data components
- Split editor toolbars into `minimal` / `full` modes; added footnote marker pairing/indexing and
  Markdown-paste-to-HTML conversion, both with unit tests
- Profile rail switched from flex to block layout; grid layout selector, display-options button, and
  optional plain-text location rendering for non-linked cards
- Single member profile links use `Link` so open-in-new-tab and copy-link work

### Android

- versionCode 145 → 157, versionName 1.35.0 → 1.39.0

### Tooling, scripts & docs

- Scripts: `render-scroll.mjs` profile scroll videos, `build-social-logos`, chat-transcript export to
  Markdown (with local-timezone timestamps), interest deduplication, ranked candidate generation with
  off-platform `TARGET_FILE` support
- CI: conditional Jest worker settings, lint timeout down to 5 min, test timeout up to 15 min, `jq` for
  `metadata.json` generation, `package.json` in the Node cache key
- Docs: iOS-without-a-Mac workflow, Play Store review plan, fediverse/ActivityPub feed plan
- E2E: scoped locators, centralized `clearFilters`, "Search as member" admin filter for testing
  member-specific results

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.14.0...1.15.0

---

## 1.14.0 — 2026-08-02

### New features

- Referral links are now editable — pick your own link, and the share button and QR code update with it
- Redesigned settings: theme, font and language pickers, plus clearer account and privacy controls
- Added exercise habits to profiles, with a matching filter
- Profile form now has a section index — sticky on desktop, a collapsible bar on mobile
- Long-press a profile card on touch devices to reveal its actions
- Links you type in bios, comments and messages are detected automatically, and stay correct when edited
- Emoji reactions on messages can now be toggled off
- When no profiles match, the search page shows a summary of the filters you applied
- The Filters button now shows how many filters are active

### Improvements

- Redesigned the home, about, profile and press pages
- New profile photo experience: a hero photo with a swipeable carousel underneath
- Redesigned proposals: color-coded vote buttons, status indicators, and filters
- Redesigned the new-message email with an avatar, profile link, and conversation context
- Warmer welcome email with a founder's note and your referral link
- Notifications from the same conversation now collapse into one instead of stacking up
- Renamed "My Matches" to "Looking For" for clarity
- Grouped "Background" fields (ethnicity, raised in) with cultural information; moved orientation above
  languages; gave photos their own category in the optional profile form
- Going back now restores your scroll position instead of jumping to the top
- Better mobile keyboard handling: the bottom nav gets out of the way and the message view keeps its place
- Compass links now open inside the app instead of bouncing out to the browser
- The filters panel docks on desktop and slides over on mobile, remembering its state
- More inclusive pronoun wording on profile connect and comment sections
- Various typography and contrast polish across profiles, chat, and timestamps
- Clearer, shorter FAQ introduction

### Trust & safety

- Clearer explanation when an account is on hold, tailored to the reason
- Moderators can act on a banned account directly from their profile
- Staff accounts are exempt from the spam guard
- Tightened database access so profile and activity data can no longer be pulled in bulk

<!--tech-->

### Security & database

- Revoked bulk-read grants on `profiles`, `users`, `user_activity`, `profile_stars` and
  `compatibility_scores`; client reads now go through row-limited security-definer functions
  (`20260730_cap_profiles_users_reads.sql`, `20260731_lock_activity_stars_compat.sql`)
- Added `ban_reason` to `users` (`20260728_add_ban_reason_to_users.sql`) and `exercise` to `profiles`
  (`20260731_add_exercise_to_profiles.sql`)
- Aggregate stats moved server-side into `stats.ts` now that the client can no longer scan tables
- Dropped the obsolete `temp_users` / `user_waitlist` reference SQL and the import-profile finalize script
- Fixed redundant parentheses in the `is_banned_from_posting` condition

### Backend & API

- Enabled `compression` middleware to cut response payload size
- OpenAPI: centralized the `securitySchemes` definition and omitted internal endpoints from the public spec
- `projection` defaults to `card` in the profiles schema
- Backend support for `banReason` on ban actions
- API version bumped 1.51.0 → 1.57.1

### Web

- Added `SyncAutolink`, a TipTap extension that updates or removes link marks as URLs are edited;
  `linkifyUrls` replaces `linkifyTrailingUrl` throughout; `linkifyjs` upgraded to 4.3.2
- New hooks: `useScrollRestoration`, `useLongPressReveal`, `useHideBottomNavOnKeyboard`, `useScrolledPast`
- Visual-viewport-based keyboard handling in `_app.tsx`; fixed scroll measuring during programmatic updates
  and container resizes; allowed scroll chaining in short panels
- Replaced `ProfileGallery` with modular `ProfileHeroPhoto`, `ProfilePhotoCarousel` and a shared
  `useProfilePhotos`
- Extracted `Section`/`SectionHeading`, `ScrollPanel`, `CompatibleBadge` and `DottedList`; added a
  `font-microcaps` utility
- Push notifications use `collapseKey` for deduplication; added `ServiceWorkerGlobalScope` globals to the
  ESLint config
- Moved the Vercel build-ignore logic into a standalone script that handles a missing previous SHA

### Android

- versionCode 134 → 145, versionName 1.32.0 → 1.35.0
- Deep links to compassmeet.com resolve via client-side navigation instead of an OS handoff

### Testing

- Capped `ts-jest` worker usage to prevent memory exhaustion on high-core-count machines
- Raised the Playwright expect timeout to 60 seconds
- Extracted `clickCheckbox` and `optionChip` helpers and added missing `data-testid` attributes
- `get-profiles` tests now mock the database client

### Tooling & docs

- Added a GitHub Action that announces published releases on Mastodon (`@compassmeet`)
- Added the iOS implementation plan (`docs/ios.md`) and reputation-system design notes
- Revamped the README; testing docs and `CLAUDE.md` now discourage monorepo-wide `yarn test`
- Deduplicated `yarn.lock`; upgraded `compression` and `react-is`

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.13.0...1.14.0

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
