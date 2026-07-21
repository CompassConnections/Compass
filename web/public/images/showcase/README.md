# Showcase portraits

Portraits for the hand-authored seed personas in `tests/e2e/utils/showcase-profiles.ts`, used only for
marketing captures. See [`docs/marketing-visuals.md`](../../../../docs/marketing-visuals.md) (W0b).

These are **fully synthetic** — generated with the Gemini image API, no real person depicted. That is
deliberate: the personas are fictional, and attaching a real person's likeness to an invented biography
would be a different and worse problem than the licensing one.

Regenerate with:

```bash
npx tsx scripts/generate-showcase-portraits.ts             # fill in anything missing
npx tsx scripts/generate-showcase-portraits.ts --only priyaraman --force
```

- Naming: `<slug>-1.jpg` … `<slug>-N.jpg`, where `<slug>` is the persona's `slug` and `N` its `photoCount`.
  `-1` is the pinned photo, so it wants the face large in frame.
- 896×1200 JPEG, q82, 100–250 KB each.
- Prompts live in the script, not here — edit `PORTRAITS` there and re-run with `--force`.

Missing files are not fatal: the seed falls back to `default-avatar.png` and warns.
