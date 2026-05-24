# Adding a new profile field

A profile field is any variable associated with a user profile, such as age, politics, diet, etc. You may want to add a
new profile field if it helps people find better matches.

To do so, you add code here:

- common/src/supabase/schema.ts
- web/components/filters/choices.tsx (if multi choices)
- web/components/optional-profile-form.tsx
- web/components/profile-about.tsx
- backend/api/src/get-profiles.ts
- common/src/api/schema.ts ('get-profiles' props)
- common/src/api/zod-types.ts (optionalProfilesSchema)
- web/components/filters/filters.tsx
- common/src/filters.ts
- common/src/filters-format.ts
- web/components/filters/use-filters.ts (yourFilters and isYourFilters)
- tests/e2e/backend/utils/userInformation.ts (UserAccountInformationForSeeding)
- Add translations (see [internationalization.md](internationalization.md))

Note that you will also need to add a column to the `profiles` table; you
can do so via this SQL command (change the type and index if not `TEXT`):

```sql
ALTER TABLE profiles
ADD COLUMN profile_field TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_profile_field ON profiles USING btree (mbti);
```

Store it in `add_<profile_field>.sql` in the [migrations](../backend/supabase/migrations) folder, add the line to
backend/supabase/migration.sql and
run [migrate.sh](../scripts/migrate.sh) from the root folder:

```bash
./scripts/migrate.sh backend/supabase/migrations/add_<profile_field>.sql
```

Optionally, if you use the remote dev DB, run the SQL above in the dev DB and sync the database types from supabase to
the local files (which assist Typescript in typing):

```bash
yarn --cwd=backend/api regen-types-dev
```

If you use your local DB, load the new schema with:

```bash
yarn test:db:reset
```

That's it!
