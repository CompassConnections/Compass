# Test coverage plan

> **Draft.** Edit freely. Steps 2 onwards are proposals, not commitments.

## The problem

- **Backend tests mostly check mocks.** 66 backend test files mock `shared/supabase/init`, while 109 of the
  146 top-level API source files run SQL. A query that is wrong against real Postgres passes all of them.
- **Coverage is uneven.** Much of the API has no unit test, including `app.ts` (1,064 lines). The web app has
  far fewer test files than components.
- **Nothing enforces coverage.** There is no `coverageThreshold` and no Codecov config, and the README's 90%
  goal is unmet.

More mocked tests would raise the number without catching these bugs, so the goal is not 90% for its own sake.
The goal is that a broken query, or a privacy rule that stopped holding, fails CI.

## Step 1: real-Postgres tier (done as a proof of concept)

Integration tests call real handlers against real Postgres. Only external services (Firebase, Discord) are
mocked.

- **Database:** a throwaway `compass_integration` database inside the local Supabase cluster, rebuilt from
  `backend/supabase/migration.sql` on every run. It is separate from the `postgres` database, so local dev data
  is untouched, and building from the migration list also proves that list still rebuilds the schema.
- **Isolation:** tables are truncated before each test, and tests run serially. Rolling back a transaction per
  test does not fit, because handlers get their connection from `createSupabaseDirectClient()` rather than
  taking it as an argument.
- **Safety:** the connection string is hardcoded to the local cluster, and truncation refuses to run unless
  Postgres itself reports `compass_integration` as the connected database.
- **CI:** an `integration` job in `ci.yml`.

Run it with `yarn test:integration` (see [testing.md](testing.md)).

## Step 2: check every query against the real schema (done)

`queries-match-schema.integration.test.ts` parses the API and shared source for query strings and runs `prepare`
on each one against the integration database. That resolves tables, columns, functions and types without
executing anything, so it needs no sample values and covers files with no tests at all. New queries are included
automatically.

It checks about 230 queries. It does not find wrong results. It also skips about 85: around 70 built at runtime
with `${...}` or a variable, and 14 that splice in identifiers or lists through pg-promise (`:name`, `:list`).
Resolving constants such as `${TESTIMONIAL_COLUMNS}` would bring some of the first group in. The `renderSql`
builder, which `get-profiles` uses, remains out of reach, so those need the behavioural tests in step 3.

## Step 3: integration tests, ordered by risk

1. **Privacy and access:** members-only redaction in the API and the RPC, blocks, banned and held members.
2. **Data lifecycle:** the rest of account deletion, and `get-user-data-export`.
3. **Complex queries:** `get-outreach-queue`, `get-member-value-ranking`, `stats`, profile search and
   compatibility.
4. **Auth wiring:** the auth and middleware behaviour in `app.ts`, through real requests.

## Step 4: web, by user journey

Do not try to cover all the components. Add Playwright flows for sign-up, profile edit, search, messaging and
account deletion, and use Jest for hooks, `lib/` logic and components with real branching. The two backend e2e
specs are stubs of 8–9 lines, to be filled in or removed.

## Step 5: coverage ratchet

Measure the baseline, set each workspace's threshold just below it, and only ever raise it. Add a patch coverage
target on new code. Replace the README's 90% goal with this ratchet.

## Open questions

- **`banned_networks` reference rows.** Truncation clears the 12 rows the migrations insert, because the table
  has a foreign key to `users`. Tests seed what they need. Revisit if many tests want those rows.

## Findings so far

- **Fixed: `trackAuditEvent` inserted into `audit_events`, a table that does not exist.** It was a leftover from the
  Manifold code, reached by `ban-user` through `trackPublicEvent`, and `tryOrLogError` swallowed the failure. The
  call is gone, and bans now go to PostHog only.
- **Fixed: deleting an account left the member's ID in other members' rows,** in `profile_likes.target_id`,
  `profile_ships.target1_id` and `target2_id`, and `search_alert_sends.matched_user_ids`. Migration
  `20261106_remove_deleted_members_from_likes_ships_alerts.sql` and `delete-me` now clear them.
