# Documentation for development

> [!WARNING]  
> TODO: This document is a work in progress. Please help us improve it!

See those other useful documents as well:
- [knowledge.md](knowledge.md) for high-level architecture and design decisions.
- [README.md](../backend/api/README.md) for the backend API
- [README.md](../backend/email/README.md) for the email routines and how to set up a local server for quick email rendering
- [README.md](../web/README.md) for the frontend / web server

### Adding a new profile field

A profile field is any variable associated with a user profile, such as age, politics, diet, etc. You may want to add a new profile field if it helps people find better matches.

To do so, you can add code in a similar way as in [this commit](https://github.com/CompassConnections/Compass/commit/b94cdba5af377b06c31cebb97c0a772ad6324690) for the `diet` field.

[//]: # (If you also want people to filter by that profile field, you'll also need to add it to the search filters, as done in [this commit]&#40;https://github.com/CompassConnections/Compass/commit/591798e98c51144fe257e28cf463707be748c2aa&#41; for the education level. )

Note that you will also need to add a column to the `profiles` table in the dev database before running the code; you can do so via this SQL command (change the type if not `TEXT`):
```sql
ALTER TABLE profiles ADD COLUMN some_new_profile_field TEXT;
```

Store it in `add_some_some_profile_field.sql` in the [migrations](../backend/supabase/migrations) folder and run [migrate.sh](../scripts/migrate.sh) from the root folder:
```bash
./scripts/migrate.sh backend/supabase/migrations/add_some_new_profile_field.sql
```

Then sync the database types from supabase to the local files (which assist Typescript in typing):
```bash
yarn regen-types dev
```

That's it!

### Cover with tests

Best Practices

* Test Behavior, Not Implementation. Don’t test internal state or function calls unless you’re testing utilities or very critical behavior.
* Use msw to Mock APIs. Don't manually mock fetch—use msw to simulate realistic behavior, including network delays and errors.
* Don’t Overuse Snapshots. Snapshots are fragile and often meaningless unless used sparingly (e.g., for JSON response schemas).
* Prefer userEvent Over fireEvent. It simulates real user interactions more accurately.
* Avoid Testing Next.js Internals . You don’t need to test getStaticProps, getServerSideProps themselves—test what they render.
* Use jest.spyOn() for Internal Utilities . Avoid reaching into modules you don’t own.
* Don't test just for coverage. Test to prevent regressions, document intent, and handle edge cases.
* Don't write end-to-end tests for features that change frequently unless absolutely necessary.