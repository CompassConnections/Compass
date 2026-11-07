# Database migrations

Migrations live in [`supabase/migrations/`](../supabase/migrations) and are tracked by the Supabase CLI. Each
database records what it has applied in `supabase_migrations.schema_migrations`, and `supabase db push` runs
only what is missing. The SQL from before the switch is gone from the tree. Older scripts and docs that cite
`backend/supabase/migrations/` or `migration.sql` mean those files as of the `pre-cli-migrations` git tag.

## Adding a migration

```bash
npx supabase migration new add_my_field   # creates supabase/migrations/<timestamp>_add_my_field.sql
yarn test:db:reset                        # rebuilds the local database from all migrations, plus the seed
yarn --cwd=backend/api regen-types-dev    # once dev has it
```

Merging to `main` applies it: `.github/workflows/cd-backend.yml` pushes to dev, then to prod, and only then
deploys the API if its version changed. There is no approval step: merging is the decision to ship.

That workflow runs on every push to `main`, whether or not tests pass or the API version changed. Dev gets
`db push` every time, which does nothing when it is up to date. Prod runs only when the push changes
`supabase/migrations/`, so a migration whose prod run failed needs a re-run of that workflow. Prod is skipped
when dev fails. Nothing else checks a migration before it reaches prod, so review it before merging, and hold
back a slow or destructive one (a big index, a long lock, a data rewrite) until a quiet time.

- **Never run `db push`, `db reset --linked` or `migration repair` from a laptop against prod.** Those commands
  act on whatever the checkout is linked to, so keep checkouts linked to dev.
- **Never run `supabase config push`, against dev or prod.** `supabase/config.toml` configures the local stack
  only, and that command would copy its local values, such as the `127.0.0.1` site URL, onto the linked project.
- **Don't edit a migration once merged.** Write a new one.
- **Rebase before merging** if `main` gained a newer migration: `db push` refuses a file older than the last
  one applied, and the timestamp comes from when the file was created. Rename it with a fresh timestamp.
- **Reference rows are not in the baseline.** `db pull` copies the schema, not data, so a fresh database has no
  `banned_networks` rows. Prod and dev keep theirs. New rows that every database needs belong in a migration.

## Rollbacks

The CLI has no down migrations. Undo a change with a new migration, add before you drop (ship the new shape, move
the code, drop the old shape in a later release), and keep point-in-time recovery as the last resort.

## Cutover

Run by a human, in this order. Steps marked **prod** touch the production database.

**Before you start.** This checkout is linked to prod today, so link deliberately at each step. Hold new
migrations until this is finished. Check that dev and prod both run Postgres
17, as `major_version` in `supabase/config.toml` says, or the baseline may not rebuild locally.

1. **Rehearse on dev.** Clear the generated files first, or `db pull` stops on a history mismatch.

   ```bash
   rm -f supabase/migrations/*.sql
   npx supabase link --project-ref zbspxezubpzxmuxciurg
   SUPABASE_DB_PASSWORD=ZTNlifGKofSKhu8c npx supabase db pull --linked baseline    # answer n to "Update remote migration history table?"
   rm supabase/migrations/*_baseline.sql
   ```

2. **Pull the baseline (prod).** Answering `n` keeps this read-only.

   ```bash
   npx supabase link --project-ref ltzepxnhhnrnvovqblfr
   npx supabase db pull --linked baseline    # answer n
   ```

   Delete the `CREATE TRIGGER … ON realtime.…` and `… ON storage.…` statements at the end: they are Supabase's
   own, and they fail on a local stack without Realtime and Storage.

   Read the file, and check that every migration you expect on prod, as of the `pre-cli-migrations` tag, is
   reflected in it.

3. **Prove it locally.** `yarn test:db:reset` wipes the local database, then `yarn test:integration`.

4. **Align dev.** `db diff` lists what dev has that the baseline does not.

   ```bash
   npx supabase link --project-ref zbspxezubpzxmuxciurg
   SUPABASE_DB_PASSWORD=ZTNlifGKofSKhu8c npx supabase db diff --linked
   ```

   If it is empty, run `npx supabase migration repair --status applied <version> --linked`. If not, rebuild dev
   with `./scripts/dev_db_reset.sh`, which wipes dev.

5. **Mark the baseline applied (prod).** This writes one row to the history table and changes no schema.

   ```bash
   npx supabase link --project-ref ltzepxnhhnrnvovqblfr
   npx supabase migration repair --status applied <version> --linked
   npx supabase migration list --linked      # the baseline must show on both sides
   npx supabase link --project-ref zbspxezubpzxmuxciurg
   ```

6. **Set up GitHub.** Create the `dev` and `prod` environments, each with a `SUPABASE_DB_PASSWORD` secret
   holding that database's password, and limit both to deployments from `main`.

7. **Merge.** Do not merge before steps 5 and 6: this merge adds a migration file, so it triggers the workflow.
   Without the history row `db push` would run the baseline against prod. The first run should find nothing to apply.

CI connects with a connection string to the session pooler, `aws-1-us-west-1.pooler.supabase.com:5432`, so it needs
no Supabase access token, and the password must not contain characters that need percent-encoding. If a
project's pooler host changes (see Connect in its dashboard), update `.github/workflows/cd-backend.yml`.
