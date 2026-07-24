# Compass — Social Media Videos

A **standalone** [Remotion](https://www.remotion.dev) studio for producing Compass promo/social videos
(Instagram Reels, TikTok, YouTube Shorts). Videos are defined in React and rendered to MP4.

## ⚠️ Deliberately isolated from the monorepo

This folder is **not** a yarn workspace and is **not** installed by the repo-root `yarn install`. It has its
own dependency tree so the web app and API never pull Remotion (and its bundled headless browser) by accident.

- Root `package.json` `workspaces` is an explicit list — this folder is intentionally left out.
- Install and run it **only from inside `media-creator/`**, using **npm** (not yarn), so it never touches the
  root `node_modules` or `yarn.lock`.
- `node_modules/`, `out/`, and `.remotion/` are gitignored.

## Setup

```bash
cd media-creator
npm install          # first time only — also downloads a headless browser for rendering
npm run fonts        # brand web faces for the OG card; uncommitted, see Stills below
```

Two render inputs are not in the repo and are not installed by npm:

- `public/fonts/` — fetched by `npm run fonts` (and automatically by `npm run still:og`).
- `public/logo.svg` — a copy of `web/public/favicon.svg`, which the root `.gitignore` excludes along
  with every other `*.svg`. Copy it by hand: `cp ../web/public/favicon.svg public/logo.svg`. Every
  scene that draws the logo needs it.

## Preview (interactive studio)

```bash
npm run studio       # opens the Remotion Studio at http://localhost:3000
```

> Previewing `OgCard` in the studio needs `npm run fonts` first — the studio does not run it, and
> the render fails loudly rather than falling back to a substitute face.

## Render to MP4

The same intro renders into two Instagram-ready formats:

```bash
npm run render:post    # -> out/compass-intro-post.mp4   4:5  (1080×1350) — feed post
npm run render:story   # -> out/compass-intro-story.mp4  9:16 (1080×1920) — story / reel
npm run render         # alias for render:post (the primary format)
```

Both are 30fps H.264, ready to upload.

| Format | Composition id | Ratio | Pixels    | Use                                                               |
| ------ | -------------- | ----- | --------- | ----------------------------------------------------------------- |
| Post   | `IntroPost`    | 4:5   | 1080×1350 | Instagram **feed post** — tallest ratio allowed in-feed (primary) |
| Story  | `IntroStory`   | 9:16  | 1080×1920 | Instagram **Story / Reel**, TikTok, YouTube Shorts (secondary)    |

## Videos

### Intro (`IntroPost` / `IntroStory`)

The brand intro — what Compass is and why. Content sourced from the About page and FAQ.

### Profile tour (`ProfileTourStory` / `ProfileTourPost`)

A ~30s section-by-section walk through a real profile page: header → details → interests →
personality → bio → photos → compatibility prompts → links → CTA. Story is the primary format here
(it's a Reel).

```bash
npm run render:tour        # -> out/compass-profile-tour-story.mp4   9:16 (primary)
npm run render:tour:post   # -> out/compass-profile-tour-post.mp4    4:5
```

Every shot is a **screenshot of the live app**, not a mock-up, so the video can never drift from
what the product actually looks like. Regenerate the artwork whenever the profile UI changes:

```bash
yarn dev                                        # from the repo root — needs http://localhost:3000
npm run capture:profile                         # -> public/profile/*.png
npm run capture:profile -- http://localhost:3000/SomeoneElse
```

`scripts/capture-profile.mjs` shoots the page at 430×932 CSS px @ DPR 2 (so the PNGs are 2× and stay
crisp on the 1080-wide canvas), hides fixed chrome and the Next.js dev badge, and clips one image per
card. It borrows Playwright from the **monorepo root** by absolute path, deliberately — this package
stays Remotion-only.

**Compatibility Prompts and Endorsements only render for a signed-in viewer.** Firebase keeps its auth
in IndexedDB, which Playwright's `storageState` does not carry, so the script uses a persistent browser
profile you sign into by hand, once:

```bash
npm run capture:profile -- --login    # opens a real window; sign in yourself
npm run capture:profile               # later runs reuse the session, headless
```

The session lives in `.auth-profile/` (gitignored — it is a real login). Without it those two cards are
simply skipped, with a warning, and the rest still captures.

> Sign in as **someone other than the profile's owner**. Viewing your own profile renders the prompts
> card in its editing form; a different account gives the visitor view ("Important to …", "Answer
> yourself"), which is what someone watching the reel would actually see.

> The scene scales each shot by width and pans the ones taller than the frame. If a card's height
> changes substantially, update its entry in `SHOTS` at the top of `src/scenes/ProfileTour.tsx` — the
> pan maths reads those dimensions.

Both formats share the same scenes; the taller Features scene compacts automatically on the shorter 4:5
canvas. Formats are defined in `src/theme.ts` (`FORMATS`) and registered in `src/Root.tsx`.

> Don't post the 9:16 story as a feed post — Instagram crops it to ~4:5. Use `IntroPost` for the feed.

## Stills

### Social preview card (`OgCard`)

The default link preview — what WhatsApp, X, Slack, LinkedIn and friends show for a shared
compassmeet.com link. 1200×630, the 1.91:1 `summary_large_image` slot. A `<Still>`, not a
`<Composition>`: there is no timeline.

```bash
npm run still:og        # -> out/compass-og-card.jpg  (~80 KB, well under WhatsApp's ceiling)
```

It covers every page that does not set its own image; pages that do (a profile) get the separate
per-profile card generated at runtime by `web/pages/api/og/profile.tsx`. The two deliberately share
a visual language — warm cream canvas, amber rules, serif voice — so a shared profile and a shared
home link look like they come from the same place.

Publishing it is the usual R2 loop, plus one extra rule:

```bash
npm run still:og
npm run upload:media    # uploads it as images/og-card-v1.jpg alongside the clips
                        # then re-deploy: the web build pulls it into web/public/images
```

> **The filename is versioned, and a redesign must bump the version.** WhatsApp and X cache a
> preview image _by URL_ and effectively never revalidate it. Overwriting `og-card-v1.jpg` leaves
> everyone who already shared a link looking at the old card indefinitely. To ship a new design,
> bump `-v1` to `-v2` in all three places at once: `scripts/upload-media.sh`,
> `web/scripts/fetch-media.mjs`, and `OG_CARD` in `common/src/hosting/constants.ts` (which is what
> the meta tags in `web/pages/_app.tsx` read).

Copy on the card is the home page's own wording (`web/components/home/home.tsx`), so the preview
cannot promise something the landing page does not say. If the home headline changes, re-render.

#### Fonts

This is the one scene that uses the real web faces — Newsreader for the headline, DM Sans for the
eyebrow, Cormorant Garamond for the wordmark — rather than the system stack the videos use.

The woff2 files live in `public/fonts/` and are **not committed** (`.gitignore`), like the hero clips
and `public/logo.svg`. Fetch them with:

```bash
npm run fonts              # no-op when they are already there
npm run fonts -- --force   # re-download, e.g. to pick up a new family version
```

`npm run still:og` runs this itself, so rendering the card is a single command. `scripts/fetch-fonts.mjs`
resolves the download URLs through the Google Fonts css2 API rather than hardcoding gstatic paths:
those carry a family version (`/newsreader/v26/`) that Google rotates, so a hardcoded list would rot
silently.

`src/components/BrandFonts.ts` registers the faces and holds the render open until the browser
reports them ready. A missing or corrupt file **cancels the render** instead of falling back to
Georgia — a card in the wrong typeface would ship unnoticed, a red render will not.

## Structure

```
media-creator/
├── package.json            standalone deps (npm)
├── remotion.config.ts      render settings (codec, quality)
├── public/logo.svg         Compass logo (copied from web/public/favicon.svg; uncommitted)
├── public/fonts/           brand web faces, OG card only (npm run fonts; uncommitted)
└── src/
    ├── index.ts            registerRoot
    ├── Root.tsx            composition registry
    ├── theme.ts            brand colors / fonts / output FORMATS
    ├── components/         Background, Logo, BrandFonts, reusable animations
    ├── scenes/Intro.tsx    the intro video (shared by both formats)
    └── scenes/OgCard.tsx   the default social preview card (a still)
```

## Adding another video

1. Build a component under `src/scenes/`.
2. Register a `<Composition>` for it in `src/Root.tsx` (one per format if it needs both aspect ratios —
   read the canvas with `useVideoConfig()` to adapt the layout, as the Features scene does).
3. `npm run studio` to preview, then `npx remotion render <id> out/<name>.mp4`.

## Keeping the brand in sync

`src/theme.ts` and `public/logo.svg` mirror the web app (`web/styles/globals.css`,
`web/public/favicon.svg`). If the web palette or logo changes, update them here too.

Content in the intro is sourced from the app's About page and FAQ (`web/pages/about.tsx`,
`web/public/md/faq.md`).
