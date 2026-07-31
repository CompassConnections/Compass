# backend/supabase

Per-table SQL definitions and `make` targets that regenerate TypeScript types from the live database.

The **active migrations** are authored here in [`migrations/`](migrations/) — this is the source of truth.
Apply them with `./scripts/migrate.sh backend/supabase/migrations/<file>.sql` (see
[`../../supabase/CLAUDE.md`](../../supabase/CLAUDE.md)). The `supabase/migrations/` folder at the repo root
is generated/derived and gitignored — don't add migrations there.

## Layout

```
backend/supabase/
├── makefile                Regen type / schema targets
├── migrations/             Active migrations — YYYYMMDD_<name>.sql, applied in filename order (source of truth)
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
- Adding a new table: create a new migration in [`migrations/`](migrations/), apply it (see
  `../../supabase/CLAUDE.md`), then run `make regen-types-dev` so the types in `common/` pick it up.
- Don't hand-edit `common/src/supabase/schema.ts` — it gets overwritten by `regen-types`.

## Related docs

- [`../../docs/database-schema.md`](../../docs/database-schema.md) — the overall data model
- [`../../docs/database-connection-pooling.md`](../../docs/database-connection-pooling.md)
- [`../../docs/profile-fields.md`](../../docs/profile-fields.md) — adding a new profile field end-to-end
