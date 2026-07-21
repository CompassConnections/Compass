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

### H1 — Hero search demo (highest value)

The page says "Don't Swipe. / Search." and then shows no search. A 10–15s loop — typing `stoicism`, filter
chips appearing, result cards sliding in — proves the core differentiator at a glance.

- Build as a `SearchDemo` Remotion scene in `media-creator/`, fed by a `capture-search.mjs` companion to the
  existing `capture-profile.mjs`.
- Place below the CTA row in `home.tsx`, above the divider, framed in browser chrome.
- Static poster is the LCP image (`next/image`, `priority`, AVIF); `<video muted autoplay loop playsinline
preload="none">` swaps in after load. Budget ~2 MB.
- `prefers-reduced-motion: reduce` → poster only, no video element mounted.
- Needs W0 (search results must show real people).

### H2 — Feature-card micro-screenshots

The three cards (`home.tsx:202-227`) each carry a generic Heroicon. Replace with a cropped ~400px-wide
fragment of the real UI:

| Card                  | Visual                                      |
| --------------------- | ------------------------------------------- |
| Radically Transparent | search results grid, no "recommended" badge |
| Built for Depth       | filter panel with value/interest chips      |
| Community Owned       | GitHub contributor graph                    |

Layout unchanged; the icon tile becomes a bordered image. Needs W0.

### H3 — Replace the fabricated avatars

`SocialProof` (`home.tsx:69-74`) renders four gradient circles lettered S/R/T/L next to "700+ **real** people
worldwide". Fabricated avatars next to the word _real_, on a platform selling radical transparency, is the one
visual on the page that actively costs trust.

Options, in order of preference:

1. 4–5 actual member photos, with explicit opt-in recorded.
2. Drop the avatars; keep the count.

Do **not** substitute showcase-seed photos here — the copy claims these are real members.

## About page

This page is a reference doc, not a pitch; it needs evidence, not a hero.

### A1 — Proof for "Democratic"

`about.tsx:235-252` links to `/vote` and `/constitution` in text. A small real screenshot of an actual vote
tally turns the assertion into evidence.

### A2 — Proof for "Community Owned / no VC"

The one place a genuine human photo belongs, because it evidences the governance claim rather than selling a
lifestyle: contributor photos, a Discord screenshot, or the GitHub contributor wall.

### A3 — Growth chart (optional)

A simple line of the member count over time near the `ShareStrip`. `web/public/md/financials.md` already
establishes the transparency framing.

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
| W0c | Run the seed                   | W0, W0b    | **Martin** |
| H1  | Hero search demo               | W0c        | Claude     |
| H2  | Feature-card micro-screenshots | W0c        | Claude     |
| H3  | Real member avatars            | opt-in     | **Martin** |
| A1  | Vote-tally screenshot          | —          | Claude     |
| A2  | Community photo                | —          | **Martin** |
| A3  | Growth chart                   | —          | Claude     |

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
