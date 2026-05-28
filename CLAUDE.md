# CLAUDE.md

Guidance for Claude Code working in this repo. Keep this file lean — per-package details live in each
package's own `CLAUDE.md`. Detailed prose lives under `docs/`.

## Project

Compass ([compassmeet.com](https://compassmeet.com)) — transparent platform for forming deep, authentic
1-on-1 connections. Yarn-workspaces monorepo: Next.js web, Express API, Capacitor Android shell, shared TS
packages. Backed by Supabase (Postgres), Firebase (auth + media), Vercel (web), Google Cloud (API).

## Workspaces

| Path                | What it is                                      | Read first                                                 |
| ------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `web/`              | Next.js + React + Tailwind frontend             | [`web/CLAUDE.md`](web/CLAUDE.md)                           |
| `backend/api/`      | Express REST + WebSocket server                 | [`backend/api/CLAUDE.md`](backend/api/CLAUDE.md)           |
| `backend/shared/`   | Backend-only utils (DB, websockets, monitoring) | [`backend/shared/CLAUDE.md`](backend/shared/CLAUDE.md)     |
| `backend/email/`    | React-email templates + send helpers            | [`backend/email/CLAUDE.md`](backend/email/CLAUDE.md)       |
| `backend/scripts/`  | One-off scripts (migrations, maintenance)       | [`backend/scripts/CLAUDE.md`](backend/scripts/CLAUDE.md)   |
| `backend/supabase/` | Per-table SQL reference + type-regen makefile   | [`backend/supabase/CLAUDE.md`](backend/supabase/CLAUDE.md) |
| `common/`           | Types + pure utils shared by web and backend    | [`common/CLAUDE.md`](common/CLAUDE.md)                     |
| `supabase/`         | Active migrations + local-stack config          | [`supabase/CLAUDE.md`](supabase/CLAUDE.md)                 |
| `android/`          | Capacitor WebView wrapper around the web build  | [`android/CLAUDE.md`](android/CLAUDE.md)                   |

### Import boundaries (load-bearing)

- `web` and `backend/*` import **from** `common/*`. `common` never imports from `web` or `backend/*`.
- Anything in `backend/*` may import from `backend/shared`. `backend/shared` never imports from sibling
  backend packages.
- Keep `common`'s dependency footprint small.

## Cross-cutting commands

Run from the repo root. Package manager is **yarn** (`yarn install --frozen-lockfile`).

```bash
yarn dev              # web + API against the shared remote dev DB (visit http://localhost:3000)
yarn dev:isolated     # web + API + local Supabase + Firebase emulators (needs Docker, Supabase CLI, Java 21+, Firebase CLI)
yarn lint             # ESLint across all packages
yarn lint-fix
yarn typecheck        # tsc --noEmit across all packages
yarn prettier
yarn test             # Jest unit + integration across all workspaces
yarn test:coverage
yarn test:e2e         # Playwright E2E (spins up services)
yarn test:e2e:dev     # Playwright against an already-running dev server
```

Single workspace / single test (the workspace `test` script already passes `--config`, so append Jest args):

```bash
yarn --cwd=common test
yarn --cwd=backend/api test path/to/file.unit.test.ts
yarn --cwd=web test -t "renders profile card"
```

Database:

```bash
./scripts/migrate.sh supabase/migrations/<file>.sql   # apply a migration to dev
yarn --cwd=backend/api regen-types-dev                # rebuild common/src/supabase/schema.ts
```

## Adding an API endpoint (3 files across 2 packages)

1. **Schema** — add entry (method, `authed`, Zod `props`, `returns`) in `common/src/api/schema.ts`.
2. **Handler** — `export const x: APIHandler<'endpoint-name'>` in `backend/api/src/<verb>-<resource>.ts`.
3. **Register** — add to the `handlers` map in `backend/api/src/app.ts` (~line 583).

Frontend then calls it via `useAPIGetter('endpoint-name', props)` (client) or `api('endpoint-name', props)`
(server-side). Full details in [`backend/api/CLAUDE.md`](backend/api/CLAUDE.md) and
[`web/CLAUDE.md`](web/CLAUDE.md).

## Database access

- **Backend**: `createSupabaseDirectClient()` from `shared/supabase/init` — raw SQL via pg-promise.
- **Frontend**: `db` from `web/lib/supabase/db` — Supabase JS client (PostgREST). Web cannot run raw SQL.
- Never string-concatenate SQL. Use helpers in `shared/supabase/utils` (`insert`, `update`, `updateData`,
  `bulkUpsert`, ...) or compose with `renderSql`/`select`/`from`/`where` from `shared/supabase/sql-builder`.
  SQL is lowercase by convention.

## Cross-cutting conventions

- **Timestamps**: `Date` everywhere in TS, `TIMESTAMPTZ` in Postgres (pg-promise converts). Zod handles
  Date↔string serialization across the wire. When persisting `Date` to localStorage, convert string back to
  `Date` on load.
- **Logging**: `debug()` from `common/logger` (or `log` from `shared/monitoring/log` on the backend). Never
  `console.log`.
- **No `sleep()` for "eventual consistency"** — rely on transactional integrity (see
  `backend/api/src/create-user-and-profile.ts`).
- **Don't split into multiple API calls when data can be batched in one transaction** (e.g. fetch profile
  options together).
- **Lodash** (`keyBy`, `uniq`, `uniqBy`, ...) over hand-rolled loops/Sets.
- **i18n**: `useT()` from `web/lib/locale`, then `t('key', 'English fallback')`. Translation JSON in
  `common/messages/`. Details in [`docs/internationalization.md`](docs/internationalization.md).
- **Scripts that mutate backend state or schema are run by the human, not Claude.**
- When editing files, do NOT remove comments or commented-out code.

## Docs

Architecture and patterns: [`docs/knowledge.md`](docs/knowledge.md),
[`docs/architecture.md`](docs/architecture.md), [`docs/development.md`](docs/development.md).
Frontend: [`docs/next-js.md`](docs/next-js.md), [`docs/react.md`](docs/react.md),
[`docs/filters.md`](docs/filters.md).
Database: [`docs/database-schema.md`](docs/database-schema.md),
[`docs/database-connection-pooling.md`](docs/database-connection-pooling.md),
[`docs/performance-optimization.md`](docs/performance-optimization.md).
Cross-cutting: [`docs/internationalization.md`](docs/internationalization.md),
[`docs/profile-fields.md`](docs/profile-fields.md), [`docs/testing.md`](docs/testing.md),
[`docs/logging-monitoring.md`](docs/logging-monitoring.md),
[`docs/troubleshooting.md`](docs/troubleshooting.md).
