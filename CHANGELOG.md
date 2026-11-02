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

## 1.47.0 — 2026-11-02

### New features

- **One overall compatibility score per pair.** It starts with the dealbreakers — who you're looking
  for, connection type, monogamy, wanting children — and a pair that fails one gets no score at all.
  Otherwise it blends weighted profile factors with the answers you've both given to the compatibility
  questions, which stay the heaviest row. A block at the top of every profile opens the breakdown:
  each factor with its weight, value and likely range, the rows still unknown because a field is
  blank, and the dealbreaker when there is one. Pairs with no shared answers are scored on their
  profiles alone, so every gender-compatible pair has a number
- **Every score now shows its likely range**, not a bare percentage. Three shared answers and eighty
  both used to read "72%"; the badge now draws the range as a whisker, with the estimate as a dot and
  the count of shared answers in the tooltip
- **Compatibility is the default order** of the people grid, ranked by the low end of each pair's
  range so fuller profiles win ties. [/compatibility-score](https://www.compassmeet.com/compatibility-score)
  walks through every factor, its weight, the aggregation, the evidence we lean on (including what
  each study did not measure) and what is deliberately left out — in English, French and German
- **A minimum-compatibility filter**, "at least 50 to 90%", in the Advanced group. It is saved with
  your search, so an alert fires on new members above your bar instead of on everyone who clears the
  dealbreakers
- **Saved searches can be edited in place.** The pencil in a saved search's row loads it into the
  filters column, "Get notified" becomes "Update search", and saving writes over the same search — so
  its alert history survives. Deleting one asks for confirmation first. The Get notified button has
  moved from the search bar into the filters column, with its label
- **Proposals can be edited** by their author while voting is open. An "(edited)" marker opens the
  full version history, so nobody votes on text that changed under them without knowing
- **"Is typing" in 1-on-1 conversations**, and the browser tab title carries your unread count so a
  background tab tells you when something arrived
- **Block or unblock straight from a conversation's header.** The inbox gains Blocked, Banned and
  Deleted accounts views so those threads stay out of your main list, and the thread menu drops mute
  and report when the other side is gone
- **The other person's profile beside the chat** on wide screens, so you can read what they wrote
  without leaving the conversation
- **A site footer** with link columns, socials and the language picker. FAQ, Organization and Contact
  move there from the sidebar, which now has three bands: People, Messages, Notifications and Invite
  pinned under your profile chip; Vote, What's New, Blog and About in the middle; Settings, Help and
  the app links at the foot. On desktop the sidebar collapses to a single column with one click,
  remembered per browser
- **Online communities** on profiles: a free-text field for where you gather online besides Compass —
  forums, group chats, servers, newsletters. Shown under Links and keyword-searchable
- **Donation badges** for the members who help keep Compass free and independent
- **A short video from Martin** asking long-time members to bring a few people in, shown at the
  moments a member is most likely to share
- **Sign-in buttons remember your last method** with a "Last used" badge, so you don't have to guess
  which of three providers you used
- [/values](https://www.compassmeet.com/values): the platform's values gathered from the about page,
  FAQ, constitution and terms, ending with the rules we strongly enforce

### Improvements

- Compatibility questions now come in the order the community marked important, on the prompts page
  and in the answer dialog (random and newest stay available). "Keep answering" after onboarding no
  longer replays the core questions you just answered. The answer matrix column is now "Accept from
  them", with a tooltip saying what the ticks do to the score, and comparing answers uses a larger,
  clearer modal
- Search: a **Load more** button replaces infinite scroll by default ("Load more as I scroll" is an
  option under Display). The end of the list says so and suggests which filters to relax; a very
  narrow search radius gets a warning. The "People" heading above the grid is gone
- Two-way search no longer reads a blank "interested in" as "anyone": a profile with no stated
  preference now only passes a searcher of the opposite sex
- The profile top bar is sticky and slides away while you scroll down, like the bottom nav on mobile,
  which now hides on scroll too
- New-message emails in an ongoing conversation no longer re-introduce the sender as if it were an
  opener. The welcome and unfinished-signup emails are plain letters, and the welcome skips "confirm
  your email" when Google or Apple already verified the address
- Home page: a "Community facts" block replaces the "Looking for" chart, social proof counts members
  rather than conversations, milestones land every 100 profiles, and the spotlight holds up to 100
- The consent banner has a visible "No thanks" instead of a hidden "Other options"
- The financials page formats its numbers for your locale
- Location search copes with "City, Region" instead of returning nothing
- A page no longer crashes in browsers that block site storage (cookies off, some embedded webviews)
- The proposal page highlights your own vote without you having to write an argument first
- Chat input and bio text sizes are standardised, which also stops iOS Safari zooming into the
  composer
- The primary colour ramp meets WCAG AA for text contrast
- Android now requires Android 7.0 or later
- 1,100+ members, and the counters say so

### Trust & safety

- **First messages are reviewed before they reach anyone.** You need your own profile written first;
  an opener must be at least 200 characters; an opener copied from one you already sent puts the
  account on hold; and a model reads both profiles in full and refuses a generic one. A refusal shows
  under the bubble: the check is new and in testing, the message can be edited and resent, and a
  decision that seems unfair can be reported. Staff are exempt, replies are never checked, and group
  conversations skip the opener rules. Details in [docs/first-messages.md](docs/first-messages.md)
- **The auto-hold on new conversations trips earlier.** Beside the daily cap, three new conversations
  within twenty minutes now puts the account on the same automatic hold, and one conversation can be
  started with at most ten people
- **Confirmed-abuse bans now remember the network.** Banning an account for confirmed abuse records
  its signup IP (for 90 days) and device; a later signup from the same device is locked out, from the
  same IP gets the "under review" hold with a report naming the earlier account. Shared VPN exits are
  never recorded
- **A security pass closed a long list of holes**, none of which we have any sign were used: ballots,
  anonymous proposal authors, who starred whom, the like graph, saved searches, compatibility answers
  and profile comments were all readable in bulk with the public key; the photo bucket could be
  listed folder by folder; most phone photos kept their GPS metadata; an avatar could point at a
  server that logged viewers' IP addresses; a push subscription could be redirected to another
  member; a blocked member could still like, star or declare interest in the person who blocked
  them; disabled and blocked profiles were only hidden in the browser; event attendee lists were
  public; messages could be rewritten after leaving a chat or being blocked; and the contact form
  trusted a client-supplied sender. All fixed; the technical notes have the full list

<!--tech-->

### Database

- New migrations, in order: `20260928_add_share_prompts.sql`,
  `20261010_add_online_communities_to_profiles.sql`,
  `20261023_compatibility_prompts_importance_default_zero.sql`,
  `20261023_compatibility_scores_range.sql`, `20261024_add_banned_networks.sql`,
  `20261028_add_donations.sql`, `20261028_drop_compatibility_answers_free.sql`,
  `20261028_lock_client_read_tables.sql`, `20261028_lock_likes_ships.sql`,
  `20261029_private_votes_and_stars.sql`, `20261029_redact_disabled_profiles.sql`,
  `20261031_compatibility_scores_prompt.sql`, `20261102_add_vote_edits.sql`
- `compatibility_scores` gains the credible-interval edges (nullable until the next recompute), then
  the prompt-only score moves to its own columns and the main columns hold the overall score
- `compatibility_prompts.importance_score` defaults to 0 — non-zero marks a prompt as core, and
  member-created prompts were coming in as core
- New tables: `share_prompts`, `banned_networks`, `donations`, `vote_edits`. Dropped:
  `compatibility_answers_free` and the two functions that read it (one row in prod, UI only reachable
  from an unmounted page)
- Client (anon-key) SELECT revoked on `profile_likes`, `profile_ships`, `bookmarked_searches`,
  `compatibility_answers`, `profile_comments`, `votes` and `vote_results`; `get_profile_stars` no
  longer answers for other members. Reads move to `get_votes_with_results` (security definer, creator
  hidden on anonymous proposals) and the API endpoints below
- `get_profile_by_user_id` redacts disabled profiles too, keeping the disabled flag

### Backend & API

- New endpoints: `get-compatibility-ranking`, `update-bookmarked-search`, `get-bookmarked-searches`,
  `edit-vote`, `get-my-proposal-ids`, `get-my-vote-choices`, `get-my-stars`, `get-profile-comments`,
  `get-profile-gate`, `set-channel-typing`, `delete-subscription`, `request-share-prompt`,
  `create-donation`, `delete-donation`, `get-donor-badge`, `get-donations-admin`,
  `get-member-value-ranking`, `get-private-user-admin`. Removed: `get-likes-and-ships` (accepted any
  userId; the query stays for the owner's data export)
- Overall score in `common/src/profiles/compatibility-score.ts`: dealbreakers → no row; otherwise a
  weighted geometric mean of profile factors with the prompt score as the heaviest, each factor
  carrying a range, blank fields at a neutral value with a wide range and half weight. Profile and
  option edits trigger the same per-user recompute answers do. The compatibility sort ranks by the
  low edge, keeps unscored pairs at the bottom, and falls back to newest-first when there is nobody to
  compare against instead of throwing. `get-profiles` with someone else's `compatibleWithUserId`
  answers 403 unless the caller is that member or an admin. The `minCompatibility` filter reads the
  stored point score; the alert job reads live scores on both sides of its diff
- First messages: `common/src/moderation/first-message.ts` (`MIN_FIRST_MESSAGE_CHARS` 200,
  `referencesProfile`, `findDuplicateOpener`) shared by the composer and
  `api/helpers/first-message.ts`; the profile gate in `api/helpers/profile-gate.ts` is previewed by
  `get-profile-gate` when a composer opens. `shared/moderation/opener-review.ts` sends both profiles
  whole (options by name, up to 30 answers, every filled column minus a deny-list) and says the
  profile may be incomplete; a refusal carries `OPENER_REVIEW_REJECTED_CODE`
- `MAX_NEW_CHANNELS_PER_BURST` 3 in `BURST_WINDOW_MINUTES` 20, beside the daily cap;
  `MAX_CHANNEL_MEMBERS` 10 enforced in the schema. The Discord report, API error and hold notice name
  whichever window tripped
- `banned_networks` replaces the hardcoded device tokens and IPs in `create-user-and-profile.ts`: a
  `confirmed_abuse` ban writes the signup IP (/32, or /64 for IPv6, 90-day expiry) and device token,
  lifting it removes them. `getIp` reads the rightmost `X-Forwarded-For` entry (the one Cloud Run
  appended) instead of the leftmost, which the client could set
- Security fixes: `isOwnImageUrl` on `pinned_url`, `photo_urls`, `avatarUrl` and at render time in
  the avatar widget, raw `<img>` tags and emails; upload rules and the client share one content-type
  allow-list (`image/svg+xml` was matching `image/*`; iPhone/Android video types added);
  `deleteUserFiles` prefixes end in `/` (deleting `bob` swept `bobby/`) and usernames under 3
  characters are rejected server-side; `save-subscription*` leave rows owned by someone else alone
  and sign-out calls `delete-subscription`; `assertCanInteract` on like, ship, star and declared
  interest; `get-user-and-profile` and `compatible-profiles` redact disabled and blocked profiles
  server-side; `get-events` sends attendee ids only to signed-in callers minus blocks; `edit-message`
  and `delete-message` share `getChangeableOwnMessage`; `create-comment` checks `comments_enabled`
  and two-way blocks; the contact form takes the sender from the token; `requireInternalKey` fails
  closed when `COMPASS_API_KEY` is unset and compares in constant time; `MOD_USER_IDS` /
  `VERIFIED_USER_IDS` replace `MOD_USERNAMES`; the unsubscribe endpoint binds `notification_type`
  as a parameter
- Storage rules: `allow get` instead of `allow read` on the public bucket (read = get + list)
- `fetch-media` retries transient connection errors with exponential backoff (`HttpError`)
- New-message email: one query answers both the daily cap and whether the receiver ever replied,
  which picks the `opener` / `ongoing` wording. New `plain` email shell for the welcome and
  unfinished-signup letters
- Share prompt: `request-share-prompt` evaluates the rules in `docs/share-prompt.md` and records
  the outcome in `share_prompts`
- `get-member-value-ranking`: a member's contribution score from messaging patterns, profile
  completeness, community interactions and referrals, documented with the weights
- Two-way gender clause: a blank preference passes only the opposite sex of the searcher
- API version 1.80.0 → 1.92.0

### Web

- New pages: `compatibility-score`, `values`, `admin/compatibility`, `admin/member-value`,
  `admin/donations`
- Compatibility block on the profile rail opening the breakdown modal (rows at or under 30% in red,
  score-based caveats); range whisker on the badge; `AnswerComparison` replaces `PreferredList`;
  the free-response question UI is gone with its table
- Saved-search editing in `filters` with the edit banner and Cancel; the save button lives in the
  filters column header, full width under the chips, count and Reset on one non-wrapping line
- `PageBase` renders the footer in its own grid row (`hideFooter` for viewport-sized pages); the
  sidebar takes `NavGroup`s, is as wide as its widest row (capped at 16rem), collapses via a toggle
  remembered in localStorage, and shows native-app items when running in the shells. Events and
  Testimonials are commented out of the nav, not deleted
- `ChatProfilePanel` beside 1-on-1 conversations; block/unblock in the chat header dropdown;
  Blocked / Banned / Deleted accounts views in the inbox; `useUnseenCountTitle`; typing indicator
  hook and animation
- `useHideBottomNavOnScroll` and the sticky profile top bar riding the same body class; the bar
  carries the native top inset as padding
- `useDrift` for the home spotlight auto-scroll; `use-signup-cta-visible` keeps the sidebar and page
  CTAs in step; `AuthSocialButtons` groups the providers with the "Last used" badge;
  `ShareProfileButton` replaces `ShareCTAButton`
- Every image upload is re-encoded through the canvas (was: only above 1 MB), with `strict: false`
  so the original file can never come back with its EXIF
- The web hooks for saved searches, answers and comments wait for the auth state so a signed-in
  member is never answered as a visitor
- The three localStorage readers (theme, font, …) guard against `SecurityError`
- Admins see a "Private info" button in the profile options modal (signup IP, device, email)
- Unprefixed Tailwind class tie-breaking follows stylesheet order; `HERO_SPLIT_BELOW_REM` retuned
- fr/de translations for all of the above (255 lines each)

### Android & iOS

- `minSdkVersion` 24 (Android 7.0)
- Web-only assets are filtered out of native builds; iOS push messages no longer raise an in-app
  toast, the unread badge carries it
- Android `versionCode` 181 → 193, iOS build 26 → 27, both on 1.47.0

### Tooling, scripts & docs

- Load testing: a JMeter plan under `tests/load/` with smoke and full workflows, `check_results.py`
  failing the run above a 1,200 ms p95 or the error-rate limit; `docs/load-testing.md`
- `keep-dev-db-awake.yml` pings the dev database so Supabase doesn't pause it; the E2E workflow is
  pinned to `ubuntu-24.04` for Playwright's browsers
- New docs: `ui-guidelines.md` (tokens, palette, anti-patterns), `compatibility-score.md`,
  `first-messages.md`, `share-prompt.md`, the bounties proposal, the ASBL setup guide and the Hungry
  Minds visual style spec. The FAQ, privacy policy and terms describe the score as arithmetic on
  answers and fields and link to the explainer; the schema doc describes the client read policy
- Supabase types regenerated (`banned_networks`, `donations`, minus `compatibility_answers_free`)

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.46.0...1.47.0

<!-- Store release notes. Play: paste the tagged block whole (500 chars/language).
     App Store Connect: paste each language into "What's New in This Version" without the tags.

<en-US>
• One overall compatibility score per pair, with its likely range and a full breakdown
• People are sorted by compatibility by default, with a minimum-score filter
• Saved searches can be edited in place
• See when someone is typing, and block or unblock from the chat
• The other person's profile sits beside the conversation on wide screens
• Tell people where else you gather online
• First messages are checked so generic openers never reach you
• A new footer, a tidier sidebar, and many fixes
</en-US>
<fr-FR>
• Un score de compatibilité global par paire, avec fourchette et détail
• Tri par compatibilité par défaut, avec un filtre de score minimum
• Les recherches enregistrées se modifient sur place
• Voyez quand on vous écrit, et bloquez depuis la discussion
• Le profil de l'autre à côté de la discussion sur grand écran
• Indiquez où vous vous retrouvez ailleurs en ligne
• Les premiers messages sont vérifiés : fini les ouvertures génériques
• Nouveau pied de page, barre latérale rangée et correctifs
</fr-FR>
-->

---

## 1.46.0 — 2026-09-24

### Improvements

- **Your profile now tells you when it's hidden from search, and why.** A profile with no headline
  and a bio under 100 characters is left out of search results by default (unless the searcher
  includes incomplete profiles). The notice now sits at the top of your profile and matches the rule
  search actually applies — before, it warned from 250 characters, well past where search stopped
  hiding anyone
- The rule itself is simpler: a headline or a 100-character bio is what counts. Listing a job or
  interests no longer stands in for saying anything about yourself
- The app asks for a store review when you leave a conversation someone has replied in, rather than
  on the inbox list, where the next tap usually cancelled it before it appeared. Still at most three
  times a year, and never in your first sessions
- 900+ members, and the counters now say so

<!--tech-->

### Backend & API

- `get-profiles`: the `shortBio` filter is `bio_length >= MIN_BIO_LENGTH OR headline IS NOT NULL`; the
  work / interests / `occupation_title` exemptions are dropped (`getManyToManyAnyClause` commented
  out). `MIN_BIO_LENGTH` 250 → 100, now shared by the query and `ProfileHero`'s `isFilteredFromSearch`
- `request-review-prompt`: new `conversation-exit` moment, mapped to the `got-reply` trigger. `inbox`
  stays in `REVIEW_MOMENTS` so builds already installed don't 400. Evaluation refactored into shared
  functions with per-rule diagnostics in the logs
- Review prompt rules: `REVIEW_PROMPT_COOLDOWN_DAYS` 120 → 60; `REVIEW_PROMPT_MIN_DAYS_INSTALLED`
  temporarily 0 (was 2) while the sequence is tried on real members
- Contact-form messages to Discord link the sender's username
- API version 1.79.0 → 1.80.0

### Web

- `useReviewPromptOnConversationExit` in `use-review-prompt.ts`, wired into `messages/[channelId]`;
  the inbox page no longer asks
- The too-short-bio notice moves from `ProfileBio` (`TooShortBio` removed) to a `Notice` in
  `ProfileHero`; `profile.bio.too_short` key dropped, `too_short_tooltip` reworded in fr/de
- The admin review-card tester shows the install-local half of the rules (sessions, days installed,
  calm blocker), which the real prompt fails on silently

### Tooling, scripts & docs

- `backend/scripts/2026-09-24-review-prompt-dry-run.ts`: read-only, what the review-prompt rules
  would decide for existing members

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.45.0...1.46.0

<!-- Store release notes. Play: paste the tagged block whole (500 chars/language).
     App Store Connect: paste each language into "What's New in This Version" without the tags.

<en-US>
• Your profile now tells you when it's hidden from search, and why
• A headline or a 100-character bio is all it takes to show up in search
• Small fixes and polish
</en-US>
<fr-FR>
• Votre profil vous indique s'il est masqué des recherches, et pourquoi
• Un titre ou une bio de 100 caractères suffit pour apparaître dans les recherches
• Petites corrections et améliorations
</fr-FR>
-->

---

## 1.45.0 — 2026-09-11

### New features

- **The compatibility questions are rebuilt from scratch.** The inherited OKCupid corpus is gone,
  replaced by a curated set of about 300 written for this — and they now arrive in a deliberate
  order: films and sleep schedules first, addiction history and anger last, so nobody is asked for an
  admission before they have any reason to give one
- Every question is filed under a domain — kids & family, money, work, politics, religion, sex &
  intimacy, health, and the rest — and **you can filter a profile's answers by one**. "What does this
  person think about money" over a hundred answers is now one tap rather than a scroll
- **You read someone's answer once you've answered the question yourself.** Until then the row shows
  the question and a way to answer it
- **A redesigned answer screen**: your own answer and what you'd accept sit side by side in two
  aligned columns, and importance is a scale that fills as you hover, so you can see what a click
  means before making it
- Finishing the core questions now says so, and offers to keep going, instead of quietly closing
- **A referral leaderboard** at [/leaderboard](https://www.compassmeet.com/leaderboard): who has
  personally brought the most people to Compass, with your own row always on the page — highlighted
  where you rank, or pinned to the bottom if you're further down

### Improvements

- Rarer interests, causes and jobs no longer vanish from a profile. Anything outside the most-used
  slice — including an option someone had just created — was being dropped from the page entirely
- Emails now show a member's initial where they have no photo, instead of a blank silhouette sitting
  next to the members who do
- You can start ten new conversations a day before the anti-spam limit trips, up from five — it was
  catching people who were simply busy
- The FAQ covers the iPhone app rather than the PWA workaround it replaced, and the platforms answer
  now names both stores and the minimum OS versions
- "Pause AI / Tech Skeptic" is just "Pause AI" — the two aren't the same position
- Clearer contrast on profile notes

### Trust & safety

- **An account on hold can still browse.** A provisional hold is not a verdict — nobody has looked at
  it yet, and most turn out to be genuine — so it now takes away only what can hurt other people.
  Every attempt to write says plainly that it's automatic, that a person will review it within a day,
  and that nothing already written has been lost
- Signups arriving through a commercial VPN network are held for that review. In the September 2026
  audit those networks carried 12 of the 13 confirmed-abuse accounts; it is a signal, never proof, so
  it buys a hold and a moderator's attention rather than a ban. Apple's Hide My Email is exempt —
  that's privacy plumbing, the opposite of a fraud signal

<!--tech-->

### Database

- New migrations: `20260909_categorize_compatibility_prompts.sql`,
  `20260910_recategorize_compatibility_prompts.sql`
- `compatibility_prompts.category` is populated for the whole live corpus against
  `common/src/profiles/compatibility-categories.ts`. The column existed but was effectively unused — 187 of
  220 prompts null, the other 33 carrying a mix of answer _shapes_ and domains, sometimes several
  semicolon-joined in one field. The second migration supersedes the first for the 130 prompts in the
  2026-09-10 export: the taxonomy was reshaped between them (`politics_religion`, `money_work`,
  `health_rhythm`, `conflict_communication`, `growth_emotions` and `care_obligation` split or merged),
  and applying the first alone would write 101 rows matching nothing the filter offers
- `importance_score` becomes the **serving order**, not a weight: `get-compatibility-questions` orders
  by it `DESC`, so the core 67 run 67 down to 1 and everything else sits at 0 after the ramp. A low
  number means "ask this later", never "this counts less"

### Backend & API

- New endpoints: `get-referral-leaderboard`, `get-compatibility-question-degeneracy`,
  `delete-compatibility-prompt`, `recompute-all-compatibility-scores`
- `get-referral-leaderboard` is public but `cache: 'private'` — the response varies by caller (the
  `you` row, and whether avatars are redacted), so a shared cache would serve someone else's place on
  the board. The handler, not the page, applies `redactMemberOnlyUser`
- VPN check at signup: `shared/moderation/vpn-check.ts` resolves an IP against prefixes announced by
  known VPN/hosting ASNs, fetched from RIPEstat at boot and refreshed daily (`startVpnRangeRefresh` in
  `serve.ts`, cached in tmpdir so a dev restart doesn't re-ask). Run after the user row exists, not
  inline in the signup, because a cold instance can take ten seconds to load the tables; a hit sets
  `isBannedFromPosting` with `banReason: 'under_review'` and posts to Discord `#reports`
- `canBrowseWhileBanned` / `isFullyBanned` / `bannedFromWritingError` in `common/moderation/ban.ts`,
  with `assertCanWrite` in `helpers/endpoint.ts` — the three write paths that tested
  `isBannedFromPosting` themselves all threw a bare "You are banned"
- `MAX_NEW_CHANNELS_PER_DAY` 5 → 10
- `get-user-and-profile` returns option **names** alongside ids, index for index, as `get-profiles`
  already did; queries `ORDER BY id` so the two arrays stay aligned
- `avatarSrc` in `backend/email/emails/utils.tsx`, replacing `/images/default-avatar.png`;
  `DEPLOYED_WEB_URL` dropped as unused
- API version 1.78.0 → 1.79.0

### Web

- New pages: `leaderboard`, `admin/compatibility-questions`
- The admin dashboard shows the two independent ways a prompt stops discriminating — the share on the
  most-picked self-answer and on the most-picked accepted set — greyed below 20 answers, flagged at
  70% and 85%, with delete + recompute wired to the new endpoints
- `web/components/compatibility/category.tsx` (`CompatibilityCategoryFilter`,
  `CompatibilityCategoryTag`, `matchesCategory`) and `community-importance.tsx`, which replaces the
  spelled-out "Community Importance: 35%" that wrapped to two lines on a phone
- `isPromptHiddenUntilYouAnswer` is front-end only — the answer is already in the payload, so this is
  a nudge, not a privacy boundary. A hidden prompt is searched by its question alone, so a covered
  answer isn't findable by its own text
- The answer dialog sizes to content on desktop instead of inheriting `MODAL_CLASS`'s fixed height,
  and the core run is ordered (sort control hidden) while everything after it is shuffled
- `ProfileGrid` shows a compact hold notice above the grid for a member who can still browse
- fr/de translations for all of the above

### Tooling, scripts & docs

- `scripts/bump-version.sh` rewritten: `yarn bump` moves the three versions only, `yarn bump:build`
  (new) moves the two store counters independently, both read every number back after writing and
  refuse a version that isn't higher than what's on disk
- `scripts/release.sh` and `docs/releases.md` reworked around the split between "open the next
  version" and "release it"; `cd.yml` now triggers on `CHANGELOG.md`, since the entry — not the
  version bump — is what says ship
- `docs/compatibility-questions.md`: how to write a prompt that screens, the coverage table the
  category keys derive from, and what to retire
- `backend/scripts/2026-09-10-import-selected-compatibility-prompts.ts` (validation + dry run) and
  `2026-09-10-vpn-asn-dry-run.ts` (read-only: what the VPN rule would have done to existing members)
- E2E seed sets `importance_score` descending so onboarding takes the real core-questions path
  instead of the "no core questions" fallback

**Full Changelog**: https://github.com/CompassConnections/Compass/compare/1.44.0...1.45.0

<!-- Store release notes. Play: paste the tagged block whole (500 chars/language).
     App Store Connect: paste each language into "What's New in This Version" without the tags.

<en-US>
• A rebuilt set of compatibility questions: 300 curated prompts, asked lightest first
• Filter someone's answers by topic — money, kids, politics, work and more
• You see an answer once you've answered that question yourself
• A clearer answer screen: your answer and what you'd accept, side by side
• A leaderboard of who has brought the most people to Compass
• Rarer interests and jobs no longer vanish from profiles
• Accounts under review can keep browsing while a person checks them
</en-US>
<fr-FR>
• 300 questions de compatibilité choisies, des plus légères aux plus engageantes
• Filtrez les réponses par thème : argent, enfants, politique, travail…
• Vous voyez une réponse une fois que vous avez répondu vous-même
• Un écran plus clair : votre réponse et ce que vous acceptez, côte à côte
• Un classement des membres qui ont amené le plus de monde sur Compass
• Les intérêts et métiers rares ne disparaissent plus des profils
• Les comptes en vérification peuvent continuer à naviguer
</fr-FR>
-->

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
