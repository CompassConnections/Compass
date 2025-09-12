# Documentation for development

> [!WARNING]  
> TODO: This document is a work in progress. Please help us improve it by contributing!

### Adding a new profile variable

To add a profile variable (personality type, etc.), make modifications here:

* ...

Then update the database by running a migration:

```bash
...
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