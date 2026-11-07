# supabase

Local-stack config, dev seed data and the **active migrations**, which `supabase/migrations/` holds and the
Supabase CLI tracks. Full workflow, rollbacks and the cutover: [`../docs/database-migrations.md`](../docs/database-migrations.md).

See the [root CLAUDE.md](../CLAUDE.md) for monorepo context.

## Layout

```
supabase/
├── config.toml       Local-stack config (ports, schemas, etc.) — used by `yarn dev:isolated`
├── migrations/       Active migrations — <timestamp>_<name>.sql, applied in filename order
├── seed.sql          Sample data loaded into the local DB
└── snippets/         Ad-hoc SQL snippets (not auto-applied)
```

## Adding a migration

1. `npx supabase migration new <short_name>` creates the file.
2. `yarn test:db:reset` rebuilds the local database from all migrations plus the seed (it wipes local data).
3. Merge to `main`. CI applies it to dev, then to prod with no approval step, then deploys the API.
4. Regenerate types so `common/src/supabase/schema.ts` reflects the new shape:
   ```bash
   yarn --cwd=backend/api regen-types-dev
   ```
5. Merging a migration to `main` ships it to prod, so only the human merges or pushes one. Never run `db push`, `db reset --linked` or
   `migration repair` against prod, and never run `config push` at all: `config.toml` is local-only.

## Conventions

- SQL is lowercase by convention across the codebase.
- One logical change per migration. Don't edit a merged migration — write a new one that alters / fixes.
- There are no down migrations: undo with a new migration, and add before you drop.
- The local stack (`yarn dev:isolated`) needs Docker, the Supabase CLI, Java 21+, and the Firebase CLI.

## Related docs

- [`../docs/database-schema.md`](../docs/database-schema.md) — overall data model
- [`../docs/database-connection-pooling.md`](../docs/database-connection-pooling.md)
- [`../docs/profile-fields.md`](../docs/profile-fields.md) — adding a profile field end-to-end (touches
  migrations + common + web)
