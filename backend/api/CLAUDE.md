# backend/api

Express 5 REST + WebSocket server. One file per endpoint under `src/`. Runs at
`https://api.compassmeet.com` in prod, `https://api.dev.compassmeet.com` in dev (separate
`compass-57c3c` project), `http://localhost:8088` locally.

See [README.md](README.md) for full Google Cloud setup, deployment, SSH access, and DNS. Cross-package
context lives in the [root CLAUDE.md](../../CLAUDE.md).

## Layout

```
backend/api/
├── src/
│   ├── serve.ts                 Entry point (tsx watch in dev)
│   ├── app.ts                   Express setup + handlers map (~line 583)
│   ├── routes.ts                Route definitions
│   ├── helpers/
│   │   ├── endpoint.ts          APIHandler<>, APIError, withRateLimit, auth glue
│   │   └── private-messages.ts
│   ├── <verb>-<resource>.ts     One file per endpoint (get-me.ts, create-event.ts, ...)
│   └── public/                  Static assets copied into dist
├── tests/unit/                  Jest unit tests
├── Dockerfile, main.tf          Cloud Run / Terraform
└── deploy-api.sh, ssh-api.sh    Manual ops
```

## Endpoint flow

1. **Schema**: add the entry (method, `authed`, Zod `props`, `returns`) in `common/src/api/schema.ts`.
2. **Handler**: create `src/<verb>-<resource>.ts`:

   ```ts
   import {APIHandler, APIError} from './helpers/endpoint'

   export const getThing: APIHandler<'get-thing'> = async (props, auth) => {
     // auth.uid available when authed: true
     return {...}
   }
   ```

3. **Register** in the `handlers` map in `src/app.ts`.

## Conventions

- **Database**: `createSupabaseDirectClient()` from `shared/supabase/init` — pg-promise (`oneOrNone`,
  `manyOrNone`, `none`). Never string-concatenate SQL; use helpers from `shared/supabase/utils` (`insert`,
  `update`, `updateData`, `bulkUpsert`, ...) or `renderSql`/`select`/`from`/`where` from
  `shared/supabase/sql-builder`. SQL is lowercase by convention.
- **Auth**: handler gets `(props, auth)`. `auth.uid` is the user ID, `auth.creds.kind` is
  `firebase` | `key` | `session`.
- **Errors**: `throw APIError(404, 'User not found')` — never raw `Error`. Standard codes: 400, 401, 403,
  404, 429, 500.
- **Rate limiting**: wrap with `withRateLimit(handler, {name, limit, windowMs})` when an endpoint can be
  abused.
- **WebSocket broadcasts**: import from `shared/websockets/helpers` (`broadcastUpdatedUser`, ...). Topics
  defined there are what `useApiSubscription` on the frontend can listen to.
- **Logging**: `log.info / log.error` from `shared/monitoring/log`. Never `console.log`.
- **Transactions over multi-step state**: don't `sleep()` waiting for eventual consistency. Build atomic
  inserts (see `create-user-and-profile.ts` for the pattern).
- **Test files**: `*.unit.test.ts` next to or under `tests/unit/`. Mock pg-promise with a fake `oneOrNone` /
  `manyOrNone` rather than spinning up a DB. See [`../../docs/testing.md`](../../docs/testing.md).

## Build / run / test

```bash
yarn --cwd=backend/api dev                            # tsx watch on src/serve.ts
yarn --cwd=backend/api build                          # tsc → dist/
yarn --cwd=backend/api typecheck
yarn --cwd=backend/api lint[-fix]
yarn --cwd=backend/api test [path/to/file.unit.test.ts]
yarn --cwd=backend/api regen-types-dev                # rebuild common/src/supabase/schema.ts from dev DB
```

`yarn dev` from the repo root brings up `web` + this API together (preferred for most work).

## Deployment

Push to `main` triggers GitHub Actions deploy. Manual: `./deploy-api.sh prod` (see [README.md](README.md)).
SSH for logs / debugging: `./ssh-api.sh prod`. Secrets live in Google Cloud Secrets Manager — names in
`common/src/secrets.ts`.

## Related docs

- [`../../docs/database-connection-pooling.md`](../../docs/database-connection-pooling.md) — pool tuning
- [`../../docs/performance-optimization.md`](../../docs/performance-optimization.md) — query optimisation
- [`../../docs/logging-monitoring.md`](../../docs/logging-monitoring.md)
- [`../../docs/database-schema.md`](../../docs/database-schema.md)
- [`../../docs/troubleshooting.md`](../../docs/troubleshooting.md)
