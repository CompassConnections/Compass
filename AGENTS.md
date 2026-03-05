# AGENTS.md - AI Assistant Guidelines for Compass

This file provides guidance for AI assistants working on the Compass codebase.

## Project Overview

Compass (compassmeet.com) is a transparent dating platform for forming deep, authentic 1-on-1 connections. Built with Next.js, React, Supabase, Firebase, and Google Cloud.

## Project Structure

```
/web                    # Next.js frontend (React, Tailwind CSS)
/backend/api           # Express.js REST API
/backend/shared        # Shared backend utilities
/backend/email        # Email functions
/common               # Shared types and utilities between frontend/backend
/supabase             # Database schema and migrations
/android              # Android mobile app
```

## Key Conventions

### Database Access

- Use `createSupabaseDirectClient()` for backend SQL queries (pg-promise)
- Use Supabase JS client (`db.from('table')`) for frontend queries
- Never use string concatenation for SQL - use parameterized queries

### API Development

1. Add endpoint schema to `common/src/api/schema.ts`
2. Create handler in `backend/api/src/`
3. Register in `backend/api/src/app.ts`

### Component Patterns

- Export main component at top of file
- Name component same as file (e.g., `profile-card.tsx` → `ProfileCard`)
- Use smaller, composable components over large ones

### Internationalization

- Translation files in `common/messages/` (en.json, fr.json, de.json)
- Use `useT()` hook: `t('key', 'fallback')`

### Testing

- Unit tests: `*.unit.test.ts` in package `tests/unit/`
- Mock external dependencies (DB, APIs, time)
- Use `jest.mock()` at top of test files

### Profile System

- Profile fields stored in `profiles` table
- Options (interests, causes, work) stored in separate tables with many-to-many relationship
- Always fetch profile options in parallel using Promise.all

### User Registration Flow

1. Create user + profile + options in single transaction
2. Never use sleep() hacks - rely on transactional integrity
3. Return full profile data from creation API

### Important Patterns

#### Frontend API calls (server-side):

```typescript
const result = await api('endpoint-name', {props})
```

#### Frontend API calls (client-side):

```typescript
const {data} = useAPIGetter('endpoint-name', {props})
```

#### Translation:

```typescript
const t = useT()
return <div>{t('key', 'Default text')}</div>
```

## Common Tasks

### Adding a profile field

1. Add column to `profiles` table via migration
2. Add to schema in `common/src/api/schema.ts`
3. Update frontend forms/components

### Adding translations

1. Add key to `common/messages/en.json`
2. Add translations to `fr.json`, `de.json`, etc.

## Things to Avoid

- Don't use string concatenation for SQL queries
- Don't add sleep() delays for "eventual consistency" - fix at DB level
- Don't create separate API calls when data can be batched in one transaction
- Don't use console.log - use `debug()` from `common/logger`

## Key Dependencies

- Node.js 20+
- React 19
- Next.js 16
- Supabase (PostgreSQL)
- Firebase (Auth, Storage)
- Tailwind CSS
- Jest (testing)
- Playwright (E2E testing)
