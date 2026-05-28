# common

Types and pure utilities shared by `web` and `backend/*`. No environment-specific code.

See the [root CLAUDE.md](../CLAUDE.md) for monorepo context.

## Import rules (load-bearing)

- `web` and `backend/*` import **from** `common/*`.
- `common` **never** imports from `web` or `backend/*`. Doing so breaks tree-shaking and creates cycles in the
  TS project references.
- Keep package dependencies here minimal. New runtime deps should live in `web` or `backend/*` unless both
  truly need them.

## Layout

```
common/
├── src/
│   ├── api/schema.ts        Zod schema for every endpoint (props + returns + method + authed).
│   │                        The single source of truth for the API contract.
│   ├── supabase/schema.ts   Auto-generated table types (regen via backend/api).
│   ├── user.ts              User / PrivateUser shapes
│   ├── profiles/            Profile-domain types and helpers
│   ├── filters.ts, filters-format.ts   Search filters
│   ├── envs/                Environment constants, prod config
│   ├── logger.ts            debug() — use everywhere instead of console.log
│   ├── util/                Pure utility helpers
│   └── ...
├── messages/                Translation JSON (de.json, fr.json). English is the inline fallback.
└── tests/
```

## Working in here

- **Adding an endpoint schema**: add an entry to `src/api/schema.ts`. The handler lives in `backend/api/src/`
  (see the [root CLAUDE.md](../CLAUDE.md) for the full 3-step flow).
- **Regenerating Supabase types**: run from the API package, output lands here.
  ```bash
  yarn --cwd=backend/api regen-types-dev    # dev DB
  yarn --cwd=backend/api regen-types        # prod DB (rarely needed)
  ```
- **Date / timestamp convention**: `Date` in TS, `TIMESTAMPTZ` in Postgres, Zod handles the wire
  serialization. Strings in localStorage need manual conversion back to `Date` on load.
- **Translations**: see [`../docs/internationalization.md`](../docs/internationalization.md).

## Build / test

```bash
yarn --cwd=common typecheck
yarn --cwd=common lint[-fix]
yarn --cwd=common test
```
