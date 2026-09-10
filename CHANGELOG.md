# Changelog

Release notes for Compass. `scripts/release.sh` reads the entry for the version being tagged straight out
of this file and uses it as the GitHub release body. That release body is what the [/news](/news) page
reads, via the GitHub Releases API — so an entry here only reaches users once its version is actually
tagged and released.

**Landing an entry on `main` is what releases that version.** Between releases root `package.json`
already carries the next, unreleased version (see [docs/releases.md](docs/releases.md)), so the version
number cannot be the trigger — the entry is. A version with no entry here is never tagged and never
announced.

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
- Ends with a **store release notes** block (see below) — the copy pasted into Play and App Store Connect
  when the build is promoted to production by hand.

To edit an already-published release's notes to match this convention, use
`gh release edit <tag> --notes-file <(sed ...)` or paste manually in the GitHub UI — `scripts/release.sh`
only runs at tag-creation time, so it won't touch releases that already exist.

## Store release notes

CI ships Android to Play's internal track and iOS to TestFlight; promoting either to production is a
manual step in the console, and both ask for release notes in that moment. Writing them at the same time
as the changelog entry — rather than improvising them in the console — is what keeps the two consistent,
so every entry ends with a ready-to-paste block:

- It lives inside an **HTML comment**, so it never reaches the GitHub release body or `/news` (the
  `react-markdown` on that page renders no raw HTML, and GitHub hides comments). Copy it out of the raw
  file, not the rendered page.
- **Play** takes all languages in one field, tagged. Paste the whole `<en-US>…</fr-FR>` block into
  _Release notes_ on the production release; **500 characters per language**, tags excluded. Play falls
  back to `en-US` for locales with no block of their own — which is what `de` gets until a German
  listing exists.
- **App Store Connect** has no tagged format: _What's New in This Version_ is one field per localisation
  (English (U.S.), French), each up to **4000 characters**. Same copy, pasted twice, without the tags.
- Keep the two stores' text identical unless a platform genuinely differs — a line about an iOS-only fix
  has no business in the Play notes.
- **No price references anywhere in it** — "free", "no subscriptions", "donations", any figure. The
  description is the only field where Apple permits it (guideline 2.3.7, and the 1.42.0 rejection that
  established it: see [`docs/app-store-listing.md`](docs/app-store-listing.md)).
- User-facing voice, one line per item, no internals. Six to eight lines fits 500 characters; the
  changelog's "New features" section is the source to cut down from, not a section to reproduce.

Template for a new entry, at the end of that entry:

```
<!-- Store release notes. Play: paste the tagged block whole (500 chars/language).
     App Store Connect: paste each language into "What's New in This Version" without the tags.

<en-US>
Enter or paste your release notes for en-US here
</en-US>
<fr-FR>
Enter or paste your release notes for fr-FR here
</fr-FR>
-->
```

---

## 1.44.0 — 2026-09-08

> Version numbers converge here: web, Android and iOS now share one number (see
> [`docs/releases.md`](docs/releases.md)). The jump from `1.15.0` is the one-off cost of bringing the
> root up to the mobile shells — nothing was released as `1.16.0`–`1.43.0`.

### New features

- **Compass is on iPhone and iPad.** The iOS app is live on the App Store, alongside Android and the
  web. A new download page gives every device the right store — with a QR code for anyone reading on a
  laptop
- **Two-way search**: results now only include people who would also be open to you, matching on gender,
  age, distance, connection type and kid desire. Anything someone left blank still passes — silence
  isn't a rejection. On by default, and you can turn it off any time
- Say how far away is too far, once, in "Who I'm looking for" — and be left out of searches beyond that
  instead of turning a radius dial on every search. No limit is the default
- The kid-desire filter is now a band across the five answers rather than a single value that quietly
  swept in everything above or below it
- Filter by country
- Interests, causes and work are searchable and no longer duplicated: "Gaming", "gaming" and "GAMING"
  were three separate options, and typing "computer programming" found nothing. Search now ranks over
  names, translations and former names, the picker leads with the most-used options, and it shows you an
  existing option before offering to create a new one
- **Your referral constellation**: a star map of who joined through your link, and who joined through
  them
- **Blog**: posts on Compass, with a listing and individual post pages
- **Safety guide**: a full page on meeting people safely, in English, French and German, linked from
  help, onboarding and the messages view
- Search your conversations, and search members by name or username when starting a new message
- A redesigned share panel with ready-made messages and LinkedIn and X support
- Separate consent for being featured on Compass's own social media, nested under the existing spotlight
  toggle — and worded honestly about what withdrawing it can and can't undo
- Start signing up and never finish, and you now get one email about it, with a page to delete the
  leftover login yourself
- Fill your profile from a Setup Sheet link, alongside the existing Notion and Firefly imports
- Admins now carry a visible badge

### Improvements

- Search returns up to 500 profiles instead of 100
- Signing in is steadier: Google always offers the account chooser, cancelling a social sign-in no longer
  looks like an error, and failures say what to actually do
- Photos imported with your profile are rehosted on Compass instead of hotlinked, and the first one can
  become your profile picture
- The referral constellation loads its faces through the image optimiser — a star used to pull the full
  ~1 MB original to draw a face a few dozen pixels across
- Compass may ask you to rate it in the App Store or Play Store — at sensible moments, rarely, and
  capped for good
- Redesigned emails on one shared template, with dark-mode rendering fixed across mail clients
- Clearer onboarding copy and button labels; shorter share and welcome emails
- US locations read consistently as "USA" everywhere — search, storage and display
- Better mobile keyboard and scroll behaviour: the view no longer jumps around the on-screen keyboard,
  the chat composer and editor stop stealing drags, and the iOS bottom bar sits where it should
- Home page spotlights are now a carousel and show six members
- Proposal pages get proper link previews and search metadata
- Upload failures explain what went wrong instead of failing silently
- The delete-account survey is down to six options
- Admins can message members who have direct messages turned off
- Profile write-up import reports backend errors instead of a generic failure

### Trust & safety

- Members-only profiles were reaching logged-out visitors in full — the page showed a placeholder while
  the row itself travelled to the browser. Redaction now happens in the database function every browser
  can reach, not in the component
- Uploads are confined to per-user storage paths, enforced by the storage rules rather than by the
  client picking a folder
- Links you paste for profile import are fetched through a hardened fetcher with scheme, redirect and
  size limits
- The admin badge can't be forged, and staff names and usernames can't be impersonated
- Outreach emails skip members who only just signed up
- Logins that never became accounts are now tracked and swept, after one notice
- iOS ships a privacy manifest, with tracking compliance checked in CI

<!--tech-->

### Database

- New migrations: `20260822_add_blog_posts.sql`, `20260822_add_referred_by_user_id.sql`,
  `20260822_add_social_media_consent.sql`, `20260824_add_review_prompts.sql`,
  `20260826_raise_get_display_users_cap.sql`, `20260901_redact_member_only_profiles.sql`,
  `20260905_add_unfinished_signups.sql`, `20260907_add_pref_max_distance.sql`,
  `20260907_canonical_options.sql`
- `get_profile_by_user_id()` redacts `visibility = 'member'` rows for `anon` down to
  `user_id`/`visibility`/`disabled`; the two client reads that legitimately need the whole row moved to
  the authenticated `get-profile` endpoint
- Options gained a canonical identity: `UNIQUE (lower(name))` replaces the misnamed `idx_*_name_ci`
  indexes, per-table `*_aliases` records the names that lose a merge, `usage_count` breaks ranking ties,
  and an `AFTER UPDATE OF name` trigger rebuilds holders' `search_text` on rename
- `profiles.pref_max_distance` (miles, `NULL` = no limit) with a btree index; `wants_kids_strength` is
  replaced by the `wants_kids_range_min`/`_max` band
- `get_display_users` row cap raised 100 → 500
- `unfinished_signups` deliberately stores no email address and no FK to `users`; `review_prompts`
  records asks, not reviews, since the store APIs report nothing back

### Backend & API

- New endpoints: `search-options`, `check-option-name`, `rename-option`, `merge-options`,
  `set-option-alias`, `delete-option`, `get-options-admin`, `get-countries`, `get-blog-post(s)`,
  `get-blog-posts-admin`, `create-blog-post`, `update-blog-post`, `get-referral-tree`,
  `get-my-referral-count`, `request-review-prompt`, `sweep-unfinished-signups`,
  `delete-unfinished-signup`
- `twoWay` search costs one extra query, only when the toggle is on; each mutual check is skipped when
  the searcher has nothing to compare with. `pickKnownFilters` strips the retired
  `wants_kids_strength` out of cached localStorage and bookmarked searches so neither can 400 a strict
  props check
- `llm-extract-profile` gained Setup Sheet extraction (`recordId` → record fetch → per-heading
  `JSONContent`), `rehostExternalImages` with username-based foldering, and an `error` field on cached
  results
- `safeFetch` (`backend/api/src/helpers/safe-fetch.ts`) for user-supplied URLs; documented alongside
- `normalizeCountry` applied across search, DB writes and display, with `UNITED_STATES` centralised in
  the GeoDB module
- `OUTREACH_MIN_DAYS_SINCE_SIGNUP` shared by the `city-number` and `empty-room` jobs
- Discord hooks on new releases and new proposals; report descriptions included in report notifications
- API version 1.66.0 → 1.77.0

### Web

- New pages: `blog/index`, `blog/[slug]`, `admin/blog`, `admin/options`, `constellation`, `download`,
  `safety`, `delete-unfinished-signup`
- `optimizedImageUrl` addresses the Next image optimiser by hand for surfaces that must build a URL
  themselves (SVG `<image href>` in the constellation); media viewer switched to plain `<img>` where
  `next/image` blocked external hosts
- Webview image loader (`next.config.ts`) routes app-build images through the deployed web app so static
  export keeps optimisation
- Visual-viewport keyboard handling extended across components; `overscroll-behavior` containment in the
  chat composer, editor and scroll panel
- `SaveReferral` captures referrals app-wide; `invalidateProfilesCache` / `removeProfileFromCache`;
  `clampQuestionIndex` guards a shrinking question list
- `SharePanel` / `ShareCompassButton` replace `ShareCTAButton`; `AdminBadge`; searchable select reused by
  the country filter and the option pickers
- Compatibility answers fetch in one consolidated request with an explicit refresh
- Locale and consent persist in `localStorage` for WKWebView; diagnostics generalised from Android-only
  to `NativeApp` with per-platform labels

### iOS

- The shell landed this cycle: `NextExportRouter` / `NextExportViewController` resolve extension-less
  static and dynamic export paths; `ios_plugin_classlist.mjs` fails the build when plugins don't
  register; deployment target raised to 15.0; app name `Compass Meet`; `contentInset = never`
- `initializeAuth` instead of `getAuth` to dodge the gapi iframe on `capacitor://localhost`; Google
  sign-in presenter patched idempotently via `postinstall` for the iOS 15+ window lookup
- `cd-ios.yml` builds on `macos-15` and uploads to TestFlight; Ruby setup reordered for Capacitor 7's
  `cap sync`; WebView debugging off by default for App Store builds
- Privacy manifest plus `verify_ios_privacy.sh`; App Review replies documented in
  `docs/app-review-reply.md`
- `MARKETING_VERSION` 1.44.0, `CURRENT_PROJECT_VERSION` 20

### Android

- versionCode 157 → 175, versionName 1.39.0 → 1.44.0
- Native deep-link handling removed in favour of the Capacitor solution, with an external-redirects
  handler for deep-linked paths
- Live-update scripts removed from the build pipeline

### Tooling, scripts & docs

- `capture-store.mjs` / `render-store.mjs` automate App Store and Play screenshots (iPad canvas
  included); `make-x-ad.py` renders 1080×1080 feed creatives from demographic stats
- `scripts/cap.sh`, `sync_ios.sh`, `build_sync_ios.sh`, `webview-eval.mjs` for WKWebView evaluation via
  `ios-webkit-debug-proxy`
- New docs: `releases.md`, `app-store-reviews.md`, `app-store-listing.md` (+ `fr-FR` listing JSON),
  `app-review-reply.md`, `git-stash.md`, `feature-ideas.md`, the relationship-science module drafts, and
  the Sign in with Apple design note. Removed the stale `dev-rules.mdc`, `guidelines.md` and `rules`
- Store assets scrubbed of price wording for App Store guideline 2.3.7; `sharp` pinned to `^0.34.5` with
  install troubleshooting written up
- E2E: explicit consent checkbox on registration; CI cache fixed across operating systems

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.15.0...1.44.0

<!-- Store release notes. Play: paste the tagged block whole (500 chars/language).
     App Store Connect: paste each language into "What's New in This Version" without the tags.

<en-US>
• Compass is now on iPhone and iPad, alongside Android and the web
• Two-way search: results only show people who would also be open to you
• Say once how far is too far, instead of setting a radius every search
• Filter by country, and search interests, causes and work as you type
• Your referral constellation, a blog, and a full guide to meeting safely
• Search your conversations, and find members by name
• Steadier sign-in, a new share panel, and clearer emails
</en-US>
<fr-FR>
• Compass est sur iPhone et iPad, en plus d'Android et du web
• Recherche réciproque : seules les personnes ouvertes à vous apparaissent
• Indiquez une fois votre distance maximale, au lieu d'un rayon à chaque fois
• Filtrez par pays ; intérêts, causes et métiers sont enfin cherchables
• Votre constellation de parrainage, un blog et un guide de sécurité
• Cherchez dans vos conversations et trouvez des membres par nom
• Connexion plus fiable, nouveau panneau de partage et e-mails plus clairs
</fr-FR>
-->

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
