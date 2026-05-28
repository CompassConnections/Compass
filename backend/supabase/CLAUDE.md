# backend/supabase

Per-table SQL definitions and `make` targets that regenerate TypeScript types from the live database.

The **active migrations** that get applied to the DB live in [
`../../supabase/migrations/`](../../supabase/migrations/) —
see [`../../supabase/CLAUDE.md`](../../supabase/CLAUDE.md). This folder is for table-shape reference and the regen
tooling, not for what's actually run.

## Layout

```
backend/supabase/
├── makefile                Regen type / schema targets
├── migrations/             Older migrations kept for history (current ones are in /supabase/migrations)
├── migration.sql           One-off SQL helpers
├── users.sql, profiles.sql, ...   Reference shapes — one file per table
├── functions.sql, functions_others.sql   Postgres functions
├── extensions.sql          Postgres extensions
└── firebase.sql            Firebase-auth bridge
```

## Regenerating types

The Supabase row types in `common/src/supabase/schema.ts` are generated from the live database:

```bash
make regen-types-dev      # from the dev project
make regen-types          # from prod (rarely needed)
make regen-schema         # runs ../scripts/regen-schema.ts
```

These targets are also exposed as `yarn --cwd=backend/api regen-types-dev` / `regen-types`.

## Conventions

- SQL is lowercase by convention across the codebase.
- Adding a new table: create a new migration in [`../../supabase/migrations/`](../../supabase/migrations/),
  apply it (see `../../supabase/CLAUDE.md`), then run `make regen-types-dev` so the types in `common/` pick
  it up.
- Don't hand-edit `common/src/supabase/schema.ts` — it gets overwritten by `regen-types`.

## Related docs

- [`../../docs/database-schema.md`](../../docs/database-schema.md) — the overall data model
- [`../../docs/database-connection-pooling.md`](../../docs/database-connection-pooling.md)
- [`../../docs/profile-fields.md`](../../docs/profile-fields.md) — adding a new profile field end-to-end
