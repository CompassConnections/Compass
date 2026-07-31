# supabase

Local-stack config and dev seed data. **Migrations are authored in
[`../backend/supabase/migrations/`](../backend/supabase/CLAUDE.md)** — that is the source of truth.
`supabase/migrations/` here is generated/derived (it is gitignored); never hand-add a new migration to it.

See the [root CLAUDE.md](../CLAUDE.md) for monorepo context.

## Layout

```
supabase/
├── config.toml       Local-stack config (ports, schemas, etc.) — used by `yarn dev:isolated`
├── migrations/       Generated/derived, gitignored — NOT where you add migrations (see backend/supabase/)
├── seed.sql          Sample data loaded into the local DB
└── snippets/         Ad-hoc SQL snippets (not auto-applied)
```

## Adding a migration

1. Create a file `YYYYMMDD_<short-name>.sql` in `backend/supabase/migrations/` (NOT in
   `supabase/migrations/`). The date prefix determines apply order.
2. Apply to the dev DB:
   ```bash
   ./scripts/migrate.sh backend/supabase/migrations/<file>.sql
   ```
3. Regenerate types so `common/src/supabase/schema.ts` reflects the new shape:
   ```bash
   yarn --cwd=backend/api regen-types-dev
   ```
4. Prod migrations are applied by the human (typically as part of release), not by Claude.

## Conventions

- SQL is lowercase by convention across the codebase.
- One logical change per migration. Don't edit an applied migration — write a new one that alters / fixes.
- Migrations are append-only for prod; pre-prod migrations in `20250101*` are the historical bulk init.
- The local stack (`yarn dev:isolated`) needs Docker, the Supabase CLI, Java 21+, and the Firebase CLI.

## Related docs

- [`../docs/database-schema.md`](../docs/database-schema.md) — overall data model
- [`../docs/database-connection-pooling.md`](../docs/database-connection-pooling.md)
- [`../docs/profile-fields.md`](../docs/profile-fields.md) — adding a profile field end-to-end (touches
  migrations + common + web)
