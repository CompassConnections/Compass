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
```

## Preview (interactive studio)

```bash
npm run studio       # opens the Remotion Studio at http://localhost:3000
```

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

Both formats share the same scenes; the taller Features scene compacts automatically on the shorter 4:5
canvas. Formats are defined in `src/theme.ts` (`FORMATS`) and registered in `src/Root.tsx`.

> Don't post the 9:16 story as a feed post — Instagram crops it to ~4:5. Use `IntroPost` for the feed.

## Structure

```
media-creator/
├── package.json            standalone deps (npm)
├── remotion.config.ts      render settings (codec, quality)
├── public/logo.svg         Compass logo (copied from web/public/favicon.svg)
└── src/
    ├── index.ts            registerRoot
    ├── Root.tsx            composition registry
    ├── theme.ts            brand colors / fonts / output FORMATS
    ├── components/         Background, Logo, reusable animations
    └── scenes/Intro.tsx    the intro video (shared by both formats)
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
