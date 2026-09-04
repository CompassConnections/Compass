# Security Policy

## Supported Versions

Compass is a continuously deployed hosted service: [compassmeet.com](https://compassmeet.com) and the API
always run the tip of `main`, and that is the only build that receives security fixes. The mobile apps share
the web version number (root `package.json`, see [`docs/releases.md`](docs/releases.md)); only the latest
released build is supported, since older ones talk to the same live API.

Self-hosters should track `main` rather than pinning a tag.

## Reporting a Vulnerability

If you discover a security vulnerability within Compass, please send an email to hello@compassmeet.com. All
security vulnerabilities will be promptly addressed.

Please do not publicly disclose the vulnerability until it has been resolved.

**Out of scope**: the development credentials committed to this repository (see
[Development credentials](#development-credentials) below). They are intentionally public and reach only
throwaway test infrastructure. Reports about them will be acknowledged but not treated as vulnerabilities.

- Response time: within 24 hours for critical issues
- Disclosure policy: coordinated disclosure with a 90-day timeline

## Security Practices

This section describes what the codebase actually does today, with pointers into the source so any claim
here can be checked. It is deliberately limited to controls that are in place; planned work is tracked in
the [README roadmap](README.md) rather than described here as if it were already implemented.

### Authentication & Authorization

- **Firebase Authentication** handles user credentials; Compass never stores passwords.
- **Bearer tokens, no cookies**: every authenticated API call carries an `Authorization: Bearer <Firebase ID
token>` header, verified server-side with the Firebase Admin SDK. A second `Key` scheme exists for
  service-to-service callers. See `parseCredentials` / `lookupUser` in
  [`backend/api/src/helpers/endpoint.ts`](backend/api/src/helpers/endpoint.ts).
- **No server-side sessions**: there is no session cookie and no server session store. Firebase ID tokens
  are short-lived (~1 hour) and refreshed by the client SDK; revoking a user in Firebase takes effect as
  soon as the current token expires.
- **Admin and moderator roles** are explicit allowlists of user ids (`isAdminId` / `isModId` in
  [`common/src/envs/constants.ts`](common/src/envs/constants.ts)), checked inside the handlers that need
  them.

### API Security

- **Schema-first validation**: every endpoint declares its method, auth requirement, and a Zod schema for
  its inputs and its return type in [`common/src/api/schema.ts`](common/src/api/schema.ts). Requests that do
  not match are rejected before the handler runs.
- **Auth enforced by the schema**, not by each handler remembering to check: endpoints marked `authed` are
  wrapped by shared middleware.
- **Rate limiting** on write endpoints, declared per endpoint via the `rateLimited` flag in the schema.
- **Body size limits** per endpoint (default 1 MB; endpoints carrying binary payloads opt into a larger
  `bodyLimit`).

### CORS

**CORS is intentionally unrestricted** (`cors({})` in [`backend/api/src/app.ts`](backend/api/src/app.ts)),
which sends `Access-Control-Allow-Origin: *` and no `Access-Control-Allow-Credentials`. This is a
considered choice, not an oversight:

- The API carries **no ambient authority**. Authentication is a `Authorization` header the caller must
  attach explicitly; there are no cookies and no session. A malicious page on another origin cannot read a
  visitor's Firebase token out of `compassmeet.com`'s storage (the same-origin policy prevents that), so it
  has nothing to attach. This is the property that makes CSRF impossible here, and it is what a restrictive
  CORS policy would otherwise be protecting.
- Because the response does not allow credentials, browsers will refuse to attach cookies to a wildcard
  cross-origin request even if cookies existed.
- **CORS is not access control.** It is a browser-enforced policy; `curl`, scripts, and every non-browser
  client ignore it entirely. Locking it down would not protect a single endpoint from a determined caller —
  authentication and authorization do that work.
- The API is **meant to be publicly callable**: it serves the OpenAPI/Swagger docs and the read-only public
  endpoints behind the signed-out site, and the Capacitor Android/iOS shells make requests from origins
  (`capacitor://localhost`, `https://localhost`, `ionic://localhost`) that an allowlist tends to break on
  every platform update.

**The tripwire**: this reasoning holds only while authentication stays header-based. If Compass ever adopts
a session cookie, a `credentials: true` CORS config, or any other ambient credential, the wildcard must be
replaced with an explicit origin allowlist _in the same change_, and CSRF tokens considered. Anyone
touching auth should treat that as a blocking requirement.

### Database Security

- **Parameterized queries**: the backend talks to Postgres through pg-promise with bound parameters, or via
  the composable builders in `shared/supabase/sql-builder`. String-concatenated SQL is prohibited by
  convention ([`CLAUDE.md`](CLAUDE.md)) and absent from the codebase.
- **Row Level Security** on Supabase tables, so the browser's PostgREST client can only read what a policy
  allows. Private data (emails, IPs, tokens) lives in owner-scoped `private_*` tables, not in the
  publicly-readable `users` table.
- **Bulk-read caps**: direct `SELECT` on `users` and `profiles` is revoked from the anon and authenticated
  roles; the client reads through capped `SECURITY DEFINER` RPCs instead, so a scraper cannot page the whole
  member table through PostgREST.
- **Managed backups** via Supabase.

### Media & File Storage

The Firebase Storage bucket is **world-readable by design** — profile photos and bio media are served
straight from it to signed-out visitors. Writes are constrained
([`backend/firebase/storage.rules`](backend/firebase/storage.rules)):

- clients may only write under `user-images/{uid}/`, where `uid` must equal `request.auth.uid` — the one
  path segment a client cannot forge;
- uploads are capped at 20 MB and restricted to `image/*` or `video/*` content types, which keeps a member
  from parking an SVG or HTML file (both of which execute script when opened directly) on our storage
  origin;
- deletes are denied to all clients; account deletion runs server-side on the Admin SDK.

### Transport & Secrets

- **HTTPS/TLS** everywhere: Vercel terminates TLS for the web app, Google Cloud for the API.
- **Encryption at rest** for the database and storage volumes, provided by Supabase and Google Cloud.
- **Production secrets** are held in environment variables / provider secret stores and are not
  committed. Development credentials are, deliberately — see the next section.

### Development credentials

The credentials for the shared **development** stack are committed to this repository on purpose, so that
anyone can clone the repo and run `yarn dev` against real services without asking for access:

- the dev Supabase project's connection string, including its password
  ([`common/src/envs/dev.ts`](common/src/envs/dev.ts), `scripts/dev_db_*.sh`);
- a key for the `dev-contributors` Google Cloud service account
  (`secrets/googleApplicationCredentials-dev.json.enc`, unlocked by the passphrase in
  [`.env.example`](.env.example) — the encryption exists to keep automated secret scanners from disabling
  the key, not to hide it).

This is a considered trade-off in favour of contributor friction, and it rests on the following:

- **Dev is a separate project on every provider** — its own Supabase instance, its own Google Cloud /
  Firebase project (`compass-57c3c`), its own buckets. Production (`compass-130ba`) shares nothing with it,
  and the dev service account holds no IAM bindings outside its own project.
- **Dev holds only test data.** No real member data is ever loaded into it, so there is nothing to leak.
  Treat it as a public sandbox that anyone may read, write, or wipe; if you need it in a known state, reseed
  it (`scripts/dev_db_seed.sh`).
- **Dev credentials are never reused** for production, provider dashboards, or personal accounts.
- **Nothing in dev can send to real people**: no production email, push, or payment provider is wired to
  the dev configuration.

Contributors who would rather not touch the shared sandbox can run everything locally with
`yarn dev:isolated` (local Supabase plus Firebase emulators), which needs no credentials at all.

Rotating these credentials is pointless — they would be republished with the next commit — so please do
not report them. A report is welcome, and in scope, if you find that any of the four assumptions above is
false: a dev credential that reaches a production resource, real data in the dev stack, or a dev secret
reused elsewhere.

### Development Practices

- **Automated CI** on every push: lint, typecheck, unit tests, and Playwright end-to-end tests
  (`.github/workflows/ci.yml`, `ci-e2e.yml`).
- **Open source**: the entire codebase is public, so anyone can inspect it and report what they find.
- **Data minimization**: profile fields are opt-in, and members control the visibility of what they share.

## Incident Response

In the event of a security incident:

1. **Immediate containment**: isolate affected systems
2. **Investigation**: determine scope and impact
3. **Remediation**: apply fixes and patches
4. **Notification**: inform affected users and stakeholders
5. **Review**: post-incident analysis and process improvement

## Compliance

Compass aims to comply with relevant data protection regulations:

- **GDPR**: right of access, correction, and erasure — members can export and delete their account and data
  from the settings page
- **CCPA**: equivalent rights for California residents
- **Data retention**: account deletion removes profile data and media; see the privacy notice for details

## Security Contact

- Email: hello@compassmeet.com
- Response time: within 24 hours for critical issues
- Disclosure policy: coordinated disclosure with a 90-day timeline

---

_Last Updated: September 2026_
