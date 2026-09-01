# backend/shared

Backend-only utilities used by `backend/api`, `backend/scripts`, and `backend/email`. Things that need
Node-only deps (pg-promise, firebase-admin, monitoring SDKs) but are reused across backends.

See the [root CLAUDE.md](../../CLAUDE.md) for monorepo context.

## Import rules

- Anything under `backend/*` may import from here.
- This package **never** imports from `backend/api`, `backend/scripts`, or `backend/email`. Cross-cutting
  code lives here; package-specific code stays in its package.
- It may import from `common/*`.

## Layout

```
backend/shared/src/
├── supabase/
│   ├── init.ts             createSupabaseDirectClient() — pg-promise client (backend SQL)
│   ├── utils.ts            insert / update / updateData / bulkUpsert / bulkUpdate helpers
│   ├── sql-builder.ts      renderSql / select / from / where / orderBy / limit (sanitized)
│   ├── users.ts, messages.ts, notifications.ts, options.ts   Domain queries
├── websockets/
│   ├── server.ts, switchboard.ts
│   └── helpers.ts          broadcastUpdatedUser, broadcastUpdatedPrivateUser, ...
│                           (topics here are what the web `useApiSubscription` listens to)
├── monitoring/
│   ├── log.ts              log.info / log.error — use everywhere on the backend
│   ├── metrics.ts, metric-writer.ts, context.ts, instance-info.ts
├── safe-fetch.ts           safeFetch / readBodyWithLimit — the only way to fetch a user-supplied URL
├── init-admin.ts           Firebase Admin init
├── encryption.ts           Message encryption helpers
├── analytics.ts, audit-events.ts
└── profiles/, compatibility/, helpers/
```

## Conventions

- **SQL**: never string-concatenate. Use the helpers in `supabase/utils` for inserts/updates, or compose with
  `sql-builder` for reads. Lowercase SQL by convention.
- **New websocket topic**: add a `broadcastX` function in `websockets/helpers.ts` so the frontend has a typed
  topic to subscribe to.
- **Logging**: `log` from `monitoring/log`. `debug()` from `common/logger` is fine for verbose dev logs but
  `log` carries structured context to Cloud Logging.
- **Adding a domain helper**: if a query is reused by more than one API endpoint, lift it into
  `supabase/<domain>.ts` here rather than duplicating it.

## Build / test

```bash
yarn --cwd=backend/shared typecheck
yarn --cwd=backend/shared lint[-fix]
yarn --cwd=backend/shared test
```

## Related docs

- [`../../docs/database-connection-pooling.md`](../../docs/database-connection-pooling.md)
- [`../../docs/performance-optimization.md`](../../docs/performance-optimization.md)
- [`../../docs/LOGGING_logging-monitoringAND_MONITORING.md`](../../docs/logging-monitoring.md)
