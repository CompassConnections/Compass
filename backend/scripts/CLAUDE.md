# backend/scripts

One-off scripts: data migrations, ad-hoc maintenance, schema regeneration. **Not** a deployed service.

See the [root CLAUDE.md](../../CLAUDE.md) for monorepo context.

## Layout

Each script is a single TS or SQL file at the top level, dated for ordering:

```
backend/scripts/
├── run-script.ts                      runScript({pg}) helper — loads .env + Supabase client
├── 2026-03-10-delete-users-without-profile.ts
├── 2026-03-09-migrate-unencrypted-messages.ts
├── 2025-04-23-migrate-social-links.ts
├── regen-schema.ts                    Regenerate common/src/supabase/schema.ts
├── *.sql                              Raw SQL one-offs
└── import-tables.sh                   Bulk import from prod
```

## The `runScript` pattern

Every TS script lives inside `runScript`. It calls `initAdmin()`, loads secrets via dotenv from `.env`, and
hands you a pg-promise client:

```ts
import {runScript} from 'run-script'

runScript(async ({pg}) => {
  const rows = await pg.manyOrNone('select id from users where ...')
  for (const r of rows) {
    await pg.none('update users set ... where id = $1', [r.id])
  }
})
```

Run with `bun run <script>.ts` or `bun x ts-node <script>.ts` from this directory.

## Conventions

- Name files `YYYY-MM-DD-<purpose>.{ts,sql}` so chronological order matches schema evolution.
- Use `debug()` from `common/logger`, not `console.log`.
- Use SQL helpers (`insert`, `update`, `updateData`, `bulkUpsert`) from `shared/supabase/utils` rather than
  hand-built SQL when feasible.
- Migrations that change schema usually go in [`../../supabase/migrations/`](../../supabase/migrations/)
  instead — scripts here are for **data** changes, app-managed maintenance, or imports.

## Safety

- **The human runs these, not Claude**, especially anything that mutates prod state or schema. Treat scripts
  here as user-triggered ops.
- Always test against the dev DB first. Dry-run the loop (count rows, log what would change) before mutating.
- Don't add `sleep()` for eventual consistency — rely on transactions.

## Build / test

There are no tests here. Typecheck happens via the API package's compile step (which references this via
tsconfig paths).
