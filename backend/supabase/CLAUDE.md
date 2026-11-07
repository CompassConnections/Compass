# backend/supabase

`make` targets that regenerate TypeScript types from the live database.

**Migrations are not here.** They live in [`../../supabase/migrations/`](../../supabase/CLAUDE.md). The SQL that
used to be in this folder is at the `pre-cli-migrations` git tag.

## Regenerating types

The Supabase row types in `common/src/supabase/schema.ts` are generated from the live database:

```bash
make regen-types-dev      # from the dev project
make regen-types          # from prod (rarely needed)
```

These targets are also exposed as `yarn --cwd=backend/api regen-types-dev` / `regen-types`.

## Conventions

- SQL is lowercase by convention across the codebase.
- Adding a new table or column: see [`../../supabase/CLAUDE.md`](../../supabase/CLAUDE.md), then run
  `make regen-types-dev` so the types in `common/` pick it up.
- Don't hand-edit `common/src/supabase/schema.ts` — it gets overwritten by `regen-types`.

## Related docs

- [`../../docs/database-migrations.md`](../../docs/database-migrations.md) — how migrations work
- [`../../docs/database-schema.md`](../../docs/database-schema.md) — the overall data model
- [`../../docs/database-connection-pooling.md`](../../docs/database-connection-pooling.md)
- [`../../docs/profile-fields.md`](../../docs/profile-fields.md) — adding a new profile field end-to-end
