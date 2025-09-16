# Documentation for development

> [!WARNING]  
> TODO: This document is a work in progress. Please help us improve it by contributing!

See those other useful documents as well:
- [knowledge.md](knowledge.md) for high-level architecture and design decisions.
- [README.md](../backend/api/README.md) for the backend API
- [README.md](../backend/email/README.md) for the email routines and how to set up a local server for quick email rendering
- [README.md](../web/README.md) for the frontend / web server

### Adding a new profile variable

To add a profile variable (personality type, etc.), make modifications here:
* ...

You will likely need to update the `lovers` table of the database. Set up an SQL migration file that updates the table, as in [migrations](../backend/supabase/migrations), and run it in the same vein as [migrate.sh](../scripts/migrate.sh).

Sync the database types from supabase to the local files (which assist Typescript in typing):
```bash
yarn regen-types
```

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