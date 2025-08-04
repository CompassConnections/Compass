# Documentation for development

### Adding a new profile variable

To add a profile variable (personality type, etc.), make modifications here:

* [schema.prisma](../prisma/schema.prisma)
* [seed.ts](../prisma/seed.ts)
* [profile.tsx](../lib/client/profile.tsx)
* [schema.ts](../lib/client/schema.ts)
* [page.tsx](../app/complete-profile/page.tsx)
* [page.tsx](../app/profiles/page.tsx)
* [ProfileFilters.tsx](../app/profiles/ProfileFilters.tsx)
* [route.ts](../app/api/profiles/route.ts)
* [route.ts](../app/api/profiles/%5Bid%5D/route.ts)
* [route.ts](../app/api/user/update-profile/route.ts)

Then update the database:

```bash
npx prisma migrate dev --name add-some-profile-variable
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