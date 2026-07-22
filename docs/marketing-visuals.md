# Marketing visuals — home & about

Plan for adding visuals to the logged-out home page (`web/components/home/home.tsx`) and the about page
(`web/pages/about.tsx`). Both are currently 100% type + Heroicons; `web/public/images/` holds only logos and
`default-avatar.png`. Every differentiator ("keyword search any profile", "filter by values", "get notified
about searches", "democratic") is asserted in prose and never shown.

## Principles

- **Product visuals, not people visuals.** The home subtitle ends "— not just your photos". Stock imagery of
  smiling couples would contradict the positioning and read as the thing we're arguing against.
- **Captured, not mocked.** Everything that _can_ be a screenshot of the live app should be, so it can be
  regenerated when the UI changes instead of rotting. `media-creator/scripts/capture-profile.mjs` already
  does this for the profile tour reel; the same approach extends to marketing stills.
- **Never fabricate social proof.** See H3 below.
- **Poster-first.** The LCP element stays a static image; video is lazy and decorative.

## Prerequisite: showcase seed data (W0)

Screenshots are only as good as the database behind them. The current seed
(`tests/e2e/utils/seedDatabase.ts` + `tests/e2e/backend/utils/userInformation.ts`) produces:

- `bio` = 200–350 lorem-ipsum words, `headline` = lorem words, `keywords` = lorem words
- `age` uniform in 18–100
- `pinned_url` = `/images/default-avatar.png` for _every_ medium/full profile
- `city` / `country` / `university` / `links` / `photo_urls` / interests / causes / work never set

Unusable for capture. W0 adds a curated set of hand-authored personas alongside the faker ones — real prose,
coherent field combinations, real photos, real locations, populated interests/causes/work and social links.

**Status: in progress.** See "Showcase profiles" below.

## Home page

### H1 — Hero search demo ✅

The page said "Don't Swipe. / Search." and then never showed a search. It now does, directly under the
hero: one real mobile session, filter to women → type `meditation` → 10 people narrow to 2 → open Sofia's
profile → scroll it → write to her. That covers both halves of the pitch (keyword search _and_ filtering)
plus the payoff, which a static grid shot cannot.

**Mobile, not desktop.** A desktop capture rendered into a phone-width column puts the app's 14px type at
roughly 5px — unreadable for what is likely most of the traffic. The mobile capture is legible on a phone
at natural scale (~11px effective) and on desktop the CSS phone frame explains the tall aspect ratio
rather than it reading as an odd crop. Measured both before choosing; this was not a taste call.

**Capture** — `media-creator/scripts/capture-search.mjs` (`npm run capture:search`). Signs in as the
seeded viewer account headlessly, dismisses the growth-phase banner (timely copy would date the clip),
kills CSS animations so no frame lands mid-transition, then walks the flow shooting 27 frames. Typing and
scrolling are _captured_ step by step, not animated — so the result count updates on the app's own
debounce schedule and the clip cannot drift from the product.

Two things that bite when scripting this page:

- Both filter UIs are always in the DOM, one hidden by `lg:` classes. Playwright's `.first()` is DOM
  order, not visibility, so on a phone viewport it returns the _desktop_ control and times out. Hence the
  `firstVisible()` helper — use it for anything that exists in both layouts.
- Filter sections start collapsed, so "Any gender" must be expanded before "Woman" exists in the DOM.

Each frame carries its own `hold` in the manifest, so pacing lives next to the interaction it describes
and the Remotion scene stays a dumb sequencer.

**Tap indicators.** Frames also carry a `tap` position (CSS px) and the scene draws an expanding ring
plus a lingering dot there. Without it the clip is a series of UI states that mutate for no visible
reason — you can see _that_ the filter sheet opened, not that someone pressed a button to open it.

The marker is attached to the frame _before_ the click, and plays over the tail of its hold. Two reasons:
clicking often reflows the page (choosing a gender inserts the "Woman ×" summary row and pushes
everything down), so a position measured pre-click does not describe the post-click frame and the ripple
lands on the wrong control; and press-then-result is the truthful order.

**Smooth scrolling.** The profile scroll is 30 steps of 100px held 3 frames each, not 7 steps of 420px
held 14. Total distance and duration are about the same, but a large jump followed by stillness reads as
a stutter however long you hold it; ~33px per frame at 30fps is continuous motion. Smoothness here is
about step size, not overall pace.

Four capture traps, all fixed and all worth knowing:

- Waiting a fixed 3s after opening the profile was hostage to however long the dev server took to
  compile the route. When it ran long, the first frames caught the results list mid-navigation with the
  card greyed out and the "scroll the profile" beat opened on the wrong page. Now waits on
  `waitForURL` + `networkidle` instead of guessing.

- Playwright leaves the virtual pointer wherever it last clicked, so whatever sits under that point
  stays hovered for the rest of the run. After closing the filter sheet the pointer rested on a card's
  bookmark icon and its "Save Profile" tooltip hung over the results for the whole clip. `shoot()` now
  parks the pointer in the top-left corner before every frame.

- The first anchor on the page is the visually hidden "Skip to main content" link. Clicking it still
  ends up navigating, so the flow looked fine — but it has no bounding box, so the tap silently went
  missing. Target the result card's name heading instead.
- `scrollIntoViewIfNeeded()` stops as soon as an element is technically in the viewport, which parked
  the contact button flush against the bottom edge under the fixed nav. Use
  `scrollIntoView({block: 'center'})` for anything that gets tapped.

**Loop seam.** The clip is a looping `<video>`, so the last frame cuts straight to the first — composer
to unfiltered list, two unrelated screens, which reads as a glitch rather than a restart. The scene
dissolves the final 20 frames _into the opening frame_, so by the time the browser wraps around it is
already showing exactly what frame 0 shows and the wrap is invisible. This is the only dissolve in the
clip: every other transition is a hard step because it shows one continuous interaction, whereas the
loop point is not a transition at all.

Two knock-on details:

- Overlays inside `AbsoluteFill` need `position: absolute` themselves. `AbsoluteFill` positions only
  itself; its children are in normal flow, so the first attempt laid the fading image out _below_ the
  full-height shot and it never appeared on screen.
- The poster is `--frame=0` off the main composition, so it is pixel-identical to the video's first
  frame and playback begins with no visible jump. (An earlier version rendered the payoff instead, from
  a separate cut-short composition; that needed `--frame=-1` to dodge the loop dissolve, and it made
  the poster and the first video frame disagree.)

**Gender beat.** `GenderFilter` auto-expands its full ~20-option list when the _signed-in viewer's own_
gender is an extended one (`gender-filter.tsx`). The viewer persona is therefore `female`: Woman and Man
are the two defaults, so the beat shows a short list with a "Show more genders" link rather than a wall
of checkboxes. Nothing in the capture clicks that link.

**Query** — `meditation`, matching the home-page copy. Two results, matching for different reasons: Priya
on her visible _Meditation_ keyword chip, Sofia only through her bio prose. That shows the search reads
bios, not just tags. `--query` overrides.

**Scene** — `media-creator/src/scenes/SearchDemo.tsx`, composition `SearchDemo`. `calculateMetadata`
reads the manifest and derives canvas size _and_ duration from it, so a re-capture with a different query
or an extra beat needs no edit there. Frames are held on a step function, not cross-faded: they are
consecutive states of one interaction, and dissolving reads as a slideshow rather than as someone using
the app. No text or branding in the clip, so one render serves every locale.

```bash
npm run capture:search        # light frames + manifest -> public/search/light/
npm run capture:search:dark   # dark  frames + manifest -> public/search/dark/
npm run render:search         # -> out/compass-search-demo-light.mp4   (1.5 MB, 17s, 780x1688)
npm run render:search:dark    # -> out/compass-search-demo-dark.mp4    (1.6 MB)
npm run still:search          # -> out/compass-search-poster-light.png (frame 0)
npm run still:search:dark     # -> out/compass-search-poster-dark.png  (frame 0)
```

All six need `yarn dev` running and the `SHOWCASE=1` seed applied.

Rendered at `--crf 30` rather than Remotion's default 18: the clip is mostly static screenshots, and 30
holds text crisp at ~1.5 MB instead of well over 2 MB. Copy the outputs to `web/public/videos/search-demo.mp4` and
`web/public/images/search-demo-poster.jpg`.

### Hosting

The two clips are **not committed**. They are ~1.8 MB each, and only one is fetched per visitor (the
theme swap picks one, it mounts after `window.load`, and `prefers-reduced-motion` skips it), so the
real cost is ~1.8 MB per playing visit — roughly 18 GB/month at 10k home-page visits.

They live in **Cloudflare R2**, along with their posters, and are **pulled into `web/public/` at
build time** rather than served from R2 at runtime:

```
render  ->  npm run upload:media  ->  R2  ->  web build downloads  ->  Vercel CDN  ->  visitor
```

Why not point the `<video>` straight at R2:

- Delivery stays same-origin on Vercel's CDN — no extra DNS lookup or TLS handshake in the hero's
  request path, and no third party a visitor depends on.
- R2 is read roughly once per deploy instead of once per visitor, so the plain **r2.dev** public URL
  is sufficient. Its rate limit only matters for per-visitor serving.
- **No R2 custom domain is required.** One would need the domain to be a zone in the same Cloudflare
  account, and `compassmeet.com` is on Vercel DNS — so a custom domain would mean migrating the whole
  zone to Cloudflare (partial/CNAME setup is a Business-plan feature).

Commands and env:

```bash
npm run upload:media          # media-creator/ -> pushes both mp4s to R2 (AWS CLI; R2 is S3-compatible)
```

| Variable                     | Where          | Purpose                                                      |
| ---------------------------- | -------------- | ------------------------------------------------------------ |
| `R2_*` (4 keys)              | repo-root .env | Upload credentials. Never needed by the app or the build.    |
| `MEDIA_SOURCE_BASE_URL`      | Vercel project | Public bucket base the **build** downloads from. Not public. |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | unset          | Escape hatch to serve at runtime from a CDN instead.         |

`web/scripts/fetch-media.mjs` runs as part of `web`'s `build` script — chained into `build` rather
than a `prebuild` hook, since a build-command override would silently skip the hook.

**Any failure to obtain the assets fails the build**, verified for each path:

| Situation                                    | Result                             |
| -------------------------------------------- | ---------------------------------- |
| `MEDIA_SOURCE_BASE_URL` set, download OK     | files land in `public/`            |
| set but unreachable / 40x                    | exit 1                             |
| unset, but a local render is already present | proceeds, using the local files    |
| unset and files missing                      | exit 1, listing exactly which ones |

Nothing about the hero is committed, so a build that "succeeds" without these ships a home page whose
hero is an empty frame. Failing loudly is the point. The base URL is public, not a secret, so a
contributor who hits the last case can just set it.

**The posters are in R2 too.** Serving them from a second origin at runtime would have been a bad
trade — they are the LCP image — but the build copies them into `public/` like everything else, so
they are still same-origin off Vercel's CDN and another ~270 KB of binaries stays out of git.

Uploads use `Cache-Control: public, max-age=86400` rather than `immutable`, since filenames are
stable across re-renders and a long TTL would strand the build on an old clip.

Nothing about the hero is committed now, so **a deploy without `MEDIA_SOURCE_BASE_URL` set renders
neither the clip nor its poster.** The build warns rather than failing in that case, because a
contributor without R2 access should still be able to build.

> The root `.gitignore` blanket-ignores `*.jpg` / `*.mp4`. Those two paths are explicitly un-ignored,
> and only the two **posters** are un-ignored, because the app serves them as the LCP image. The
> videos are intentionally left ignored — R2 serves those. The showcase portraits are likewise
> **not** un-ignored: they are dev-only seed data and `scripts/generate-showcase-portraits.ts`
> regenerates them, so they stay out of the repo in line with the existing no-binaries policy. A fresh
> clone seeds profiles with the default avatar until that script is run.

**Reaching the contact beat.** Messaging is gated on a verified email, so against a fresh seed the final
shot would be the "You must verify your email" error state — an error as the payoff. Two independent
fixes, both in place:

- `seedShowcaseViewer()` verifies the viewer's email through the emulator's oobCode flow.
- `NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=1` renders the composer for an unverified account, via
  `web/lib/dev-flags.ts`. **Double-gated**: it needs the env var _and_ a non-production build, and
  `next build` sets `NODE_ENV=production` everywhere that deploys, including Vercel previews — so it is
  dead code in anything that ships. It only changes which UI is drawn; the real enforcement in
  `backend/api/src/create-private-user-message-channel.ts` still 403s unverified senders, so it cannot be
  used to message anyone. Set it in `web/.env` (gitignored, so it is per-developer).

The clip only ever _opens_ the composer. Nothing is sent, and the recipient is a fictional persona.

**Layout** — the hero is a two-column grid from `lg` up: copy left-aligned in the first column, phone
clip in the second. Below `lg` it stacks and centres, which is also the mobile shape.

The first cut stacked the clip under a centred hero, and on a 1512px screen that left ~535px of dead
space on either side of a 310px phone while pushing the features section off the fold. Side by side, the
clip's height stops being a cost and starts filling the column. The headline ceiling drops from 96px to
84px above `lg` (`lg:text-[clamp(44px,5.4vw,84px)]`) so "Don't Swipe." still holds one line in the
narrower measure — checked at the `lg` boundary itself, which is the tightest case.

Vertical spacing belongs to the grid's `gap`, not to the clip component, since it is a grid cell on wide
screens and a stacked block on narrow ones.

**Embed** — `web/components/home/search-demo.tsx`, mounted inside the hero section in `home.tsx`. The poster is a plain `next/image` with `priority`, so the LCP element is always the static
image and never the video. The `<video>` mounts only after `window.load`, so 1.5 MB never competes with
the hero copy on a cold visit. `prefers-reduced-motion: reduce` keeps the poster and mounts no video at
all — so those visitors see the opening listing rather than the payoff, the cost of having the poster
match frame 0. The phone frame is CSS, keeping the video pure product pixels.

**Filter panel restyle.** The rail was uniform `text-ink-600` with native checkboxes and no accent
colour anywhere, which is what made it read as washed out on camera. Two changes, both in the app rather
than the capture:

- `MultiCheckbox` renders **chips** instead of checkbox rows — selected fills primary with a check and a
  soft shadow, unselected is outlined and warms on hover. This reuses the chip language already on
  profile cards, so the filters and the results they produce look like one product. It is still a real
  `<input type="checkbox">` underneath (visually hidden, not replaced), so keyboard order and
  screen-reader semantics are unchanged. Shared by all 16 filters **and** the profile form.
- `FilterSection` reads as a card: an open section gets a surface, border and primary accent, an
  active-but-closed one a tint, and the chevron rotates rather than swapping icon.
- `FilterGroup` shows **containment**. An open "Background" and its "Any education" / "Any work"
  children previously sat at identical indent, weight and colour, so the children read as siblings and
  nothing said which filters belonged to the group. The group header now takes a filled pill when open
  and its children hang off an indented accent rail.
- "Include incomplete profiles" moved from a pinned row above the list into **Advanced**. It is a
  rarely-changed escape hatch, not something that should weigh on every search.

**Message composer restyle.** The "Start a meaningful conversation" modal is the payoff shot of the hero
clip and was flat canvas-on-canvas with grey text. It now opens with a warm gradient header carrying the
recipient's avatar and a "Writing to <name>" label, so the moment is addressed to a person rather than a
form. Topic chips use the same language as the filter rail — filled primary with a check when inserted —
so picking a topic here reads like narrowing a search there. The progress meter is thicker and runs on a
warm amber ramp instead of the old red-to-green traffic light: red reads as an error for what is merely
"not finished yet", and green belongs to no palette used elsewhere in the product. It resolves into an
explicit "Ready to send" state, and the character hint disappears once the threshold is met.

The panel also had to stop being forced tall. The shared modal applies a `min-h-[60vh]` floor and a
fixed height, which left roughly a third of this composer as empty canvas below the progress bar — the
single biggest reason it read as unfinished. It now hugs its content (`!min-h-0` / `!h-auto`, capped at
85vh) and sits as a bottom sheet. Worth knowing: the send button inside `CommentInputTextArea` only
renders once `isDisabled` clears, so below 200 characters there is deliberately no send affordance at
all — the meter is what tells you how far off you are.

**Modal backdrops.** `Modal` and `RightModal` both used a flat `bg-canvas-100/75` scrim with no blur —
it dimmed the page without pushing it back. Both now use `bg-canvas-100/60 backdrop-blur-lg`: the tint
had to come _down_ for the blur to be visible at all, since at 75% opacity the backdrop-filter is almost
entirely masked.

**Both themes.** The clip is a screenshot, so a light one on a dark page reads as a broken asset. Each
theme is captured separately (`--theme light|dark`) into its own directory with its own manifest, and
rendered to its own video and poster. The app defaults to `auto`, so Playwright's `colorScheme` is enough
to flip it — no localStorage seeding.

The page picks between them by watching the **`dark` class on `<html>`**, not `prefers-color-scheme`:
the site also has a manual toggle, and `use-theme.ts` resolves system preference and toggle into that
one class. A `MutationObserver` on it therefore covers both. The `<video>` is keyed on its src, because
a `<video>` does not reload when only the `src` prop changes.

Only one theme's assets are ever fetched by a given visitor, so the page cost is unchanged; the repo
carries roughly 3.2 MB for the pair.

### H2 — Feature-card micro-screenshots — **dropped**

The proposal was to replace each feature card's Heroicon with a cropped ~400px fragment of the real UI:
search grid, filter panel, GitHub contributor graph. Not doing it. Reasons, in order of weight:

1. **H1 already shows two of the three.** The search grid and the filter panel are frames of the hero clip
   playing a few hundred pixels up the same page. A still crop competing with a moving version of itself
   reads as filler.
2. **The cards are too narrow for real UI.** `max-w-4xl` over three columns with `gap-5` and `p-7` leaves
   ~229px of content width. A 400px crop scaled into that renders the app's 14px type at ~8px — the same
   legibility failure that forced H1 to mobile capture. Texture, not evidence.
3. **The cost/benefit is inverted.** Three crops × two themes = six assets to re-shoot on every panel
   restyle, plus baked-in English inside a block that is otherwise translated, for the section carrying the
   least persuasive load. The third card's visual was not even a Compass screenshot — a third-party
   contributor graph, stale on capture.

The icon tiles do the job actually needed here, which is rhythm and scannability. The proof is the hero's.

### H3 — Replace the fabricated avatars — **done (option 2)**

`SocialProof` (`home.tsx`) rendered four gradient circles lettered S/R/T/L next to "700+ **real** people
worldwide". Fabricated avatars next to the word _real_, on a platform selling radical transparency, was the
one visual on the page that actively cost trust.

The avatar row is now commented out and the count stands alone. `SocialAvatar` and the `avatars` array are
left in place behind `eslint-disable-next-line`, not deleted, so option 1 is a small edit rather than a
rewrite.

Option 1 — 4–5 actual member photos with explicit opt-in recorded — remains open and is still the better
end state. It needs consent Martin has to collect, so it is out of scope for Claude and is not tracked as
blocking. Do **not** substitute showcase-seed photos: the copy claims these are real members.

## About page

This page is a reference doc, not a pitch; it needs evidence, not a hero.

### A1 — Proof for "Democratic" — **done**

The Democratic feature card links to `/vote` and `/constitution` in text. A real vote card turns the
assertion into evidence, so there is now a "How a decision gets made" section between the feature grid and
the help cards (`web/components/about/vote-evidence.tsx`).

**Which vote, and why it matters.** The first candidate was a UX proposal reading 7 For / 2 Abstain /
0 Against, `Voting Open`. Rejected on three counts, all of which are the selection criteria for a
replacement:

1. **`Implemented ✔️`, not `Voting Open`.** An open ballot proves the mechanism exists. A shipped one
   proves it decides. The claim is that members govern, not that they can express opinions.
2. **Contested.** A tally with nothing against reads as ceremonial and invites the reading that the vote
   was a formality. Some opposition is what makes it evidence.
3. **Governance, not UX.** The claim being evidenced is about how the project is run.

The one used — "Require email verification before interacting with other people", 11 For / 0 Abstain /
1 Against, `Implemented ✔️` — satisfies all three, and is verifiable by a reader: the shipped behaviour is
enforced in `backend/api/src/create-private-user-message-channel.ts`.

**Turnout is the honest tension.** Twelve voters is a small number to place near "700+ members". It is not
a reason to fake anything; it is a reason to keep the tally off any screen that also shows the member
count, which is why this lives on the about page and not the home page.

**Privacy.** `/vote` renders for logged-out visitors (`web/pages/vote.tsx` gates only on
`user === undefined`), so tallies and proposer names are already public — screenshotting one is not an
escalation. The capture shoots the single card element rather than the viewport, so no neighbouring
proposal or member name can wander into frame.

Captured from **production** by `media-creator/scripts/capture-vote.mjs` (`npm run capture:vote`), because
the whole point is that the decision is real — a local seed would be a mock-up. Re-run it after any restyle
of `web/components/votes/vote-item.tsx`; the tally will have moved on by then, which is correct.

**Two widths, four files.** The desktop capture is 868 CSS px; scaled into a phone column it renders the
card's 14px description at about 6px — the same failure that forced H1 to mobile capture. So the card is
also shot at 390px, where it reflows into its own mobile layout and is displayed at roughly 1:1. The page
chooses with a `<picture>` media query, so exactly one file is downloaded. That rules out `next/image`,
which cannot emit a `<picture>`; the files are instead authored at the sizes actually used and encoded as
WebP, which for flat fill and text is about 45% smaller than the JPEG (80 KB vs 145 KB). `loading="lazy"`
means the hidden theme's copy is never fetched at all, so a visit costs one 80 KB image.

**The Democratic feature card no longer links to `/vote`.** This section is its proof and owns that link;
two links to the same page within one screen sent readers away before they reached the evidence. The
wording is unchanged, so the existing `fr`/`de` translations still apply.

The card's own text is English only. Translating a screenshot of a real proposal would mean fabricating it,
so the surrounding caption carries the meaning instead and is translated normally.

### A2 — Proof for "Community Owned / no VC"

The one place a genuine human photo belongs, because it evidences the governance claim rather than selling a
lifestyle: contributor photos, a Discord screenshot, or the GitHub contributor wall.

### A3 — Growth chart — **done**

A single cumulative line of the member count, sitting under the "Help Compass grow" label as the setup for
the help cards — this is what you would be helping grow. `MemberGrowth` in
`web/components/widgets/charts.tsx`.

**It lives in `charts.tsx`, not `components/about/`,** because it shares that file's date helpers with the
big `/stats` chart. Only the presentation differs, and it differs deliberately: `/stats` is an instrument —
two series, axes, grid, tooltip — for someone who came to read numbers. This is one claim on a page someone
is skimming, so it is a single line with no axes and no tooltip, and the endpoints are labelled in real
HTML rather than recharts ticks. That last part is not only taste: the tick and tooltip colours in the
`/stats` chart are hardcoded light-theme values, which HTML labels sidestep entirely.

**Queried live, never hardcoded.** A member count that quietly goes stale on a page arguing for
transparency is the failure mode worth engineering against. For the same reason it renders _nothing_ when
the query comes back empty rather than a zero, a spinner, or an empty chart frame — an empty frame claims
more than it shows. Rendering nothing is also why it has no section heading of its own: a heading with
nothing beneath it is worse than no section.

**Scaling caveat**, inherited from `getProfilesCreations`: one row per profile, cumulative curve rolled up
in the browser. Fine at ~700 and identical to what `/stats` already does, but linear — past a few thousand
members this wants an aggregate endpoint returning daily totals.

## Cross-cutting constraints

- **Dark mode doubles the assets.** The site is fully tokenised (`bg-canvas-*`, `text-ink-*`); a light-mode
  screenshot on a dark page looks broken. Capture scripts shoot both themes; serve via `<picture>` +
  `prefers-color-scheme`. This is real ongoing maintenance — accept it deliberately.
- **i18n.** Text baked into a screenshot does not translate. Keep visible copy inside captures minimal, or
  accept English-only visuals.
- **Privacy.** Nothing captured from the shared dev DB may contain real member data. Capture only against
  showcase-seed profiles (W0), which are fictional by construction.
- **Photo licensing.** Showcase portraits must be licensed for this use — AI-generated, CC0, or explicitly
  consented. Never scraped.

## Work order

| ID  | Item                           | Blocked by | Who        |
| --- | ------------------------------ | ---------- | ---------- |
| W0  | Showcase seed profiles         | —          | Claude ✅  |
| W0b | Showcase portrait photos       | —          | Claude ✅  |
| W0c | Run the seed                   | W0, W0b    | Martin ✅  |
| H1  | Hero search demo               | W0c        | Claude ✅  |
| H2  | Feature-card micro-screenshots | —          | — dropped  |
| H3  | Fabricated avatars removed     | —          | Claude ✅  |
| A1  | Vote-tally screenshot          | —          | Claude ✅  |
| A2  | Community photo                | —          | **Martin** |
| A3  | Growth chart                   | —          | Claude ✅  |

The home page is finished. On the about page, A2 needs a photo only Martin can supply and A3 is optional.
H3 option 1 (real member photos, opt-in) stays available but is not blocking anything.

---

## Showcase profiles (W0)

Ten hand-authored personas seeded next to the faker profiles, designed so that any screenshot of search,
filters, or a profile page looks like a real product with real people in it.

### Design

- Data lives in `tests/e2e/utils/showcase-profiles.ts` — plain data, no faker.
- Seeded by `seedShowcaseUsers()` in `tests/e2e/utils/seed-showcase.ts`, called from `seed-test-data.ts`
  under `SHOWCASE=1` (which seeds the personas _instead of_ the faker profiles).
- **No Firebase auth accounts.** `seedUser()` creates them because e2e tests sign in as those users; nobody
  signs in as a showcase persona. `SPEC_CONFIG` hardcodes the Firebase emulator at `localhost:9099`, so
  requiring auth would make this fail with ECONNREFUSED whenever it runs against the remote dev DB without
  the local stack up. User ids are instead derived deterministically from the slug
  (`showcase<sha256(slug)[:20]>`, 28 chars like a real uid).
- Usernames are the persona slug, so capture scripts can hard-code profile URLs
  (`/mayaokonkwo`, `/rafaelmendes`, …). Re-seeding is idempotent: ids are stable and the insert
  short-circuits if that user already exists.
- **One viewer account** (`SHOWCASE_VIEWER`, `viewer@compass.showcase` / `showcase-viewer-pass`, username
  `alexmorel`) is seeded separately and _does_ get a Firebase login. It is created through the Auth
  emulator's **admin** endpoint (`Bearer owner`) rather than the public sign-up API, because that is the
  only way to choose the uid — and it sets `emailVerified` in the same call.

  That matters: the emulator's auth store is in-memory and does **not** survive a restart, while Postgres
  does. With a server-assigned uid, restarting the emulator left the DB row orphaned under an id no
  Firebase account had, login failed with `EMAIL_NOT_FOUND`, and the next seed tried to insert a second
  row with the same username — a unique-constraint failure. A uid derived from the slug is stable across
  restarts, so re-seeding always converges. The viewer row is rebuilt every run (`users` cascades), so
  edits to the persona actually take effect instead of being skipped as "already exists". Search, filters and the profile grid
  only render for a signed-in user — `pages/index.tsx` shows `LoggedOutHome` otherwise — so signed-in
  captures need a session. Doing that by hand (the `.auth-profile` route `capture-profile.mjs` uses) goes
  stale on every reseed and can't run unattended. Its DB id is the Firebase uid, not the slug hash, because
  auth only works when the two match. Needs the emulator up; non-fatal if it isn't.

- Personas cover the filter surface deliberately: a spread of ages (24–61), genders, orientations,
  relationship intents (collaboration / friendship / relationship), countries, religions, politics, and MBTI —
  so a screenshot of the filter panel has something to match on whatever facet is demoed.
- Bios are 3-paragraph tiptap docs in a real human register, each seeded with the niche keywords the marketing
  copy promises ("stoicism", "sustainable living", "neuroscience", "hiking", "meditation").
- Interests / causes / work rows are upserted into the lookup tables by name, then linked.

### Photos (W0b — done)

29 portraits in `web/public/images/showcase/`, named `<slug>-1.jpg` … `<slug>-N.jpg` where `N` is the
persona's `photoCount`. `-1` becomes `pinned_url` and the **rest** become `photo_urls` — the two are
disjoint, because `ProfileCarousel` renders `buildArray(pinned_url, photo_urls)` without deduping and a
shared entry would show twice. Missing files degrade gracefully — the seed falls back to
`default-avatar.png` and warns.

Generated by `scripts/generate-showcase-portraits.ts` against the Gemini image API
(`gemini-3-pro-image`, `GEMINI_API_KEY` from the repo-root `.env`):

```bash
npx tsx scripts/generate-showcase-portraits.ts             # fill in anything missing
npx tsx scripts/generate-showcase-portraits.ts --only priyaraman --force
npx tsx scripts/generate-showcase-portraits.ts --dry-run   # print prompts, call nothing
```

- **Licensing**: fully synthetic. No real person to consent, no license to track, nothing scraped. This is
  the only sourcing route that is unambiguously safe for fictional profiles — a CC0 portrait of a real
  person attached to an invented biography is a different and worse problem.
- **Output**: 896×1200 JPEG, re-compressed at q82 to 100–250 KB each (4.4 MB total).
- **Identity consistency** is the hard part. Shot 1 is generated from text; shots 2..N pass shot 1 back as a
  reference image with an explicit "same person" instruction. Text alone drifts — identical descriptions
  produce different faces.
- **Prompt lessons**, encoded in the script as constants:
  - The "candid / shot on film" register drags in a white film border and an orange date stamp. `STYLE`
    rules them out by name.
  - Left alone the model backs the camera off and the subject becomes a small figure in a room. `FRAMING`
    forces a waist-up medium shot for shot 1, which is the avatar.
  - Sun-weathered cues ("tanned", "sun-bleached", "freckles") age a subject up ~10 years. The 24-year-old
    persona needed her youth asserted explicitly to stop reading as mid-thirties.

> **Deploy weight**: these live under `web/public`, so they ship with the Vercel build (4.4 MB) and are
> publicly reachable at `/images/showcase/*.jpg` even though no production page references them. That's the
> price of the dev server serving them same-origin for captures. If it becomes a problem, gitignore the
> directory and regenerate locally — the script is the source of truth, not the files.

### Running it

Scripts that mutate backend state are run by the human:

```bash
./scripts/dev_db_seed.sh          # remote dev DB
./scripts/seed.sh                 # local supabase stack
```
