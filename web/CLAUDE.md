# web

Next.js 16 + React 19 + Tailwind frontend. Runs on http://localhost:3000 (`yarn dev` from root).
Deployed to Vercel.

See [README.md](README.md) for setup, env vars, and Vercel deployment. Cross-package context lives in the
[root CLAUDE.md](../CLAUDE.md).

## Layout

```
web/
├── pages/        Next.js pages (file-based routing). API routes in pages/api/
├── components/   Grouped by feature (profile/, chat/, filters/, ...); generic ones in widgets/
├── hooks/        Custom React hooks (use-*.ts)
├── lib/
│   ├── api.ts            Typed API client (calls backend/api)
│   ├── firebase/         Firebase auth + storage SDK config
│   ├── supabase/db.ts    Supabase JS client (PostgREST wrapper)
│   ├── locale/           useT() + locale loading
│   └── service/          Analytics, push notifications
├── styles/       Global CSS; everything else is Tailwind utility classes
└── types/        web-only ambient types
```

## Conventions

- **Components**: many small components over a few large ones. Name the component the same as the file
  (`profile-card.tsx` → `ProfileCard`); export it at the top.
- **Data fetching**:
  - Server: `api('endpoint', props)` inside `getStaticProps` / `getServerSideProps`.
  - Client: `useAPIGetter('endpoint', props)` → `{data, refresh}`, in-memory cached.
  - Live updates: `useApiSubscription({topics, onBroadcast})`. Topics come from
    `backend/shared/src/websockets/helpers.ts`.
- **State that should survive navigation**: use `usePersistentInMemoryState` /
  `usePersistentLocalState` instead of `useState`. localStorage stores strings — convert back to `Date` on
  load.
- **Styling**: Tailwind utilities. Use the design tokens (`bg-canvas-50`, `text-ink-900`, ...) — don't hardcode
  colors.
- **i18n**: `const t = useT()` from `web/lib/locale`, then `t('key', 'English fallback')`. Translation JSON
  lives in `common/messages/` (`de.json`, `fr.json`). English is the inline fallback.
- **Lodash over hand-rolled loops/Sets** (`keyBy`, `uniq`, `uniqBy`, ...).
- **Logging**: `debug()` from `common/logger`, never `console.log`. For API failures use `logApiError`.
- **Accessibility primitives** already in the codebase: `ErrorBoundary`, `useLiveRegion` (`announce(...)`),
  `SkipLink` / `MainContent`. Use them rather than rolling your own.

## Adding things

- **Page**: create `pages/<route>.tsx`, wrap content in `<Page>` from `components/page-base`.
- **Component**: place under the feature folder (`components/profile/`) or `components/widgets/` if generic.
- **Hook**: `hooks/use-<thing>.ts`. Reuse existing hooks before adding new ones.
- **Translation key**: add to `common/messages/{de,fr}.json` — see
  [`../docs/internationalization.md`](../docs/internationalization.md).
- **API endpoint**: see cross-package recipe in the [root CLAUDE.md](../CLAUDE.md).

## Build / test

```bash
yarn --cwd=web serve         # next dev on :3000 (yarn dev from root runs this + API)
yarn --cwd=web build         # next build
yarn --cwd=web typecheck
yarn --cwd=web lint[-fix]
yarn --cwd=web test [-t "name"]
```

E2E (Playwright) runs from the root: `yarn test:e2e`. See [`../docs/testing.md`](../docs/testing.md).

## Related docs

- [`../docs/next-js.md`](../docs/next-js.md) — Next.js patterns we use
- [`../docs/react.md`](../docs/react.md) — React/TS fundamentals
- [`../docs/filters.md`](../docs/filters.md) — search/filter UI
- [`../docs/performance-optimization.md`](../docs/performance-optimization.md)
- [`../docs/troubleshooting.md`](../docs/troubleshooting.md)
