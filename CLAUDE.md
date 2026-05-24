# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Compass (compassmeet.com) is a transparent platform for forming deep, authentic 1-on-1 connections. It is a
Yarn-workspaces monorepo: Next.js + React web frontend, Express API backend, Capacitor Android app, and shared
TypeScript packages. Backed by Supabase (PostgreSQL), Firebase (auth + media storage), hosted on Vercel (web) and Google
Cloud (API).

## Commands

Run from the repo root unless noted. Package manager is **yarn** (`yarn install --frozen-lockfile`).

```bash
yarn dev              # Run web + API against the shared remote dev DB (visit http://localhost:3000)
yarn dev:isolated     # Run with local Supabase + Firebase emulators (needs Docker, Supabase CLI, Java 21+, Firebase CLI)
yarn lint             # ESLint across web, common, backend/{api,shared,email}
yarn lint-fix         # ESLint --fix across the same
yarn typecheck        # tsc --noEmit across all packages
yarn prettier         # Format the repo
yarn test             # Jest unit + integration across all workspaces
yarn test:coverage    # Jest with coverage
yarn test:e2e         # Playwright E2E (spins up services)
yarn test:e2e:dev     # Playwright against an already-running dev server
```

Per-package and single tests (the workspace `test` script already passes `--config`, so append Jest args):

```bash
yarn --cwd=common test                          # one workspace
yarn --cwd=backend/api test path/to/file.unit.test.ts   # one file
yarn --cwd=web test -t "renders profile card"   # by test name
```

Database migrations and types:

```bash
./scripts/migrate.sh supabase/migrations/<file>.sql   # apply a migration
yarn --cwd=backend/api regen-types-dev                # regenerate Supabase types (dev) into common/src/supabase/schema.ts
```

## Architecture

### Workspaces and import boundaries (enforced by convention, important)

- `/web` — Next.js/React/Tailwind frontend (`pages/`, `components/`, `hooks/`, `lib/`).
- `/backend/api` — Express REST + WebSocket server. Handlers are one file per endpoint in `src/`.
- `/backend/shared` — backend-only utilities (DB init, monitoring, push). Anything in `/backend` may import from
  `shared`, **not vice versa**.
- `/backend/email` — React-email templates and send routines.
- `/common` — types (User, Profile, etc.) and pure utilities shared by frontend and backend. `/web` and `/backend`
  import from `/common`, **never the reverse**. Avoid adding package dependencies here.
- `/supabase` — active Postgres migrations (`migrations/`), `config.toml`, `seed.sql` for local/isolated dev.
- `/backend/supabase` — per-table SQL definitions and the `make regen-types` targets.
- `/android` — Capacitor wrapper around the web build.

Request flow: React component → `useAPIGetter`/`api()` → HTTP → Express handler (auth middleware → handler) → Postgres →
response → React state.

### Adding an API endpoint (3 steps, spans packages)

1. Define the endpoint schema (method, `authed`, `props` as a Zod object, `returns`) in `common/src/api/schema.ts`.
2. Implement the handler `export const x: APIHandler<'endpoint-name'>` in its own file under `backend/api/src/`.
3. Register it in the `handlers` map in `backend/api/src/app.ts` (around line 583).

### Database access — two clients

- **Backend** (`createSupabaseDirectClient()` from `shared/supabase/init`): raw SQL via pg-promise (`pg.oneOrNone`,
  `pg.manyOrNone`). Web cannot do this.
- **Frontend** (`db` from `web/lib/supabase/db`): the Supabase JS client (`db.from('table').select(...)`), a PostgREST
  wrapper.
- Never string-concatenate SQL. Use the helpers in `shared/supabase/utils` (`insert`, `update`, `updateData`,
  `bulkUpsert`, ...) or compose with `renderSql`/`select`/`from`/`where` from `shared/supabase/sql-builder.ts`. SQL is
  written lowercase by convention.

### Frontend conventions

- Many small composable components over large ones. Export the main component at the top of the file; name it after the
  file (`profile-card.tsx` → `ProfileCard`).
- Client data fetching: `useAPIGetter('endpoint', props)` (returns `{data, refresh}`, cached in memory). Server-side:
  `api('endpoint', props)` inside `getStaticProps`/`getServerSideProps`.
- Prefer `usePersistentInMemoryState` / `usePersistentLocalState` over `useState` when navigating back to a page should
  feel instant.
- Live updates use WebSockets via `useApiSubscription` (topics broadcast from
  `backend/shared/src/websockets/helpers.ts`).
- Prefer lodash (`keyBy`, `uniq`, `uniqBy`) over hand-rolled loops/Sets.

### Internationalization

`const t = useT()` (from `web/lib/locale`), then `t('key', 'English fallback')`. Translation JSON lives in
`common/messages/` (`de.json`, `fr.json`; English is the inline fallback).

### Timestamps

Use `Date` everywhere in TypeScript; `TIMESTAMPTZ` in Postgres (pg-promise converts automatically). The Zod endpoint
schema handles Date↔string serialization across the wire. When persisting to localStorage, convert string back to Date
on load.

## Conventions to follow

- Don't add `sleep()` delays for "eventual consistency" — rely on transactional integrity (e.g. user + profile + options
  are created in one transaction in `create-user-and-profile.ts`).
- Don't split into multiple API calls when data can be batched in one transaction; fetch profile options.
- Don't use `console.log` — use `debug()` from `common/logger`.
- Scripts in `/backend/scripts` run inside `runScript(async ({pg}) => ...)` which loads secrets into `process.env`.
  Anything that mutates backend state or schema should generally be run by the user, not Claude.

## Detailed docs

`docs/knowledge.md` (architecture + code patterns), `docs/internationalization.md` (adding languages),
`docs/profile_fields.md` (adding profile fields), `docs/TESTING.md` (test layout and practices),
`docs/DATABASE_SCHEMA.md`, `docs/PERFORMANCE_OPTIMIZATION.md`, `docs/DATABASE_CONNECTION_POOLING.md`,
`docs/TROUBLESHOOTING.md`, `docs/Next.js.md`. Per-area READMEs in `web/`, `backend/api/`, `backend/email/`.
