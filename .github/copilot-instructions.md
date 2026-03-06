---
trigger: always_on
description:
globs:
---

## Project Structure

Compass (compassmeet.com) is a transparent dating platform for forming deep, authentic 1-on-1 connections.

- **Next.js React frontend** `/web`
  - Pages, components, hooks, lib
- **Express Node API server** `/backend/api`
- **Shared backend utilities** `/backend/shared`
- **Email functions** `/backend/email`
- **Database schema** `/backend/supabase`
  - Supabase-generated types in `/backend/supabase/schema.ts`
- **Files shared between frontend and backend** `/common`
  - Types (User, Profile, etc.) and utilities
  - Try not to add package dependencies to common
- **Android app** `/android`

## Deployment

- Both dev and prod environments
- Backend on GCP (Google Cloud Platform)
- Frontend on Vercel
- Database on Supabase (PostgreSQL)
- Firebase for authentication and storage

## Code Guidelines

### Component Example

```tsx
import clsx from 'clsx'
import Link from 'next/link'

import {User} from 'common/user'
import {ProfileRow} from 'common/profiles/profile'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

interface ProfileCardProps {
  user: User
  profile: ProfileRow
}

export function ProfileCard({user, profile}: ProfileCardProps) {
  const t = useT()

  return (
    <div className={clsx('bg-canvas-50 rounded-lg p-4')}>
      <img src={user.avatarUrl} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{profile.bio}</p>
    </div>
  )
}
```

We prefer many smaller components that each represent one logical unit, rather than one large component.

Export the main component at the top of the file. Name the component the same as the file (e.g., `profile-card.tsx` →
`ProfileCard`).

### API Calls

**Server-side (getStaticProps):**

```typescript
import {api} from 'web/lib/api'

export async function getStaticProps() {
  const profiles = await api('get-profiles', {})
  return {
    props: {profiles},
    revalidate: 30 * 60, // 30 minutes
  }
}
```

**Client-side - use hooks:**

```typescript
import {useAPIGetter} from 'web/hooks/use-api-getter'

function ProfileList() {
    const {data, refresh} = useAPIGetter('get-profiles', {})

    if (!data) return <CompassLoadingIndicator / >

    return (
        <div>
            {
                data.profiles.map((profile) => (
                    <ProfileCard key = {profile.id} user = {profile.user} profile = {profile}
    />
))
}
    <button onClick = {refresh} > Refresh < /button>
        < /div>
)
}
```

### Database Access

**Backend (pg-promise):**

```typescript
import {createSupabaseDirectClient} from 'shared/supabase/init'

const pg = createSupabaseDirectClient()
const user = await pg.oneOrNone<User>('SELECT * FROM users WHERE username = $1', [username])
```

**Frontend (Supabase client):**

```typescript
import {db} from 'web/lib/supabase/db'

const {data} = await db.from('profiles').select('*').eq('user_id', userId)
```

### Translation

```typescript
import {useT} from 'web/lib/locale'

function MyComponent() {
  const t = useT()

  return <h1>{t('welcome', 'Welcome to Compass')}</h1>
}
```

Translation files are in `common/messages/` (en.json, fr.json, de.json).

### Backend Endpoints

1. Define schema in `common/src/api/schema.ts`:

```typescript
'get-user-and-profile': {
  method: 'GET',
  authed: false,
  rateLimited: true,
  props: z.object({
    username: z.string().min(1),
  }),
  returns: {} as {user: User; profile: ProfileRow | null},
  summary: 'Get user and profile data by username',
  tag: 'Users',
},
```

2. Create handler in `backend/api/src/`:

```typescript
import {APIError, APIHandler} from './helpers/endpoint'

export const getUserAndProfile: APIHandler<'get-user-and-profile'> = async ({username}, _auth) => {
  const user = await getUserByUsername(username)
  if (!user) {
    throw APIErrors.notFound('User not found')
  }

  return {user, profile}
}
```

3. Register in `backend/api/src/app.ts`:

```typescript
import {getUserAndProfile} from './get-user-and-profile'

const handlers = {
  'get-user-and-profile': getUserAndProfile,
  // ...
}
```

### Profile Options (Interests, Causes, Work)

Options are stored in separate tables with many-to-many relationships:

- `interests`, `causes`, `work` - option values
- `profile_interests`, `profile_causes`, `profile_work` - junction tables

Fetch in parallel:

```typescript
const [interestsRes, causesRes, workRes] = await Promise.all([
  db.from('profile_interests').select('interests(name, id)').eq('profile_id', profile.id),
  db.from('profile_causes').select('causes(name, id)').eq('profile_id', profile.id),
  db.from('profile_work').select('work(name, id)').eq('profile_id', profile.id),
])
```

## Testing

### Running Tests

```bash
# Jest (unit + integration)
yarn test

# Playwright (E2E)
yarn test:e2e
```

### Test Structure

- Unit tests: `*.unit.test.ts` in `tests/unit/`
- Integration tests: `*.integration.test.ts` in `tests/integration/`
- E2E tests: `*.e2e.spec.ts` in `tests/e2e/`

### Mocking Example

```typescript
jest.mock('shared/supabase/init')

import {createSupabaseDirectClient} from 'shared/supabase/init'

const mockPg = {
  oneOrNone: jest.fn(),
  tx: jest.fn(async (cb) => cb(mockTx)),
}
;(createSupabaseDirectClient as jest.Mock).mockReturnValue(mockPg)
```

## Important Patterns

### User Registration

- Create user + profile + options in single database transaction
- Return full profile data from creation API
- Don't use sleep() hacks - rely on transactional integrity

### API Errors

```typescript
import {APIError} from './helpers/endpoint'

throw APIErrors.notFound('User not found')
throw APIErrors.badRequest('Invalid input', {field: 'email'})
```

### Logging

- Use `debug()` from `common/logger` for development
- Use `log` from `shared/utils` for production

## Things to Avoid

- Don't use string concatenation for SQL queries
- Don't add sleep() delays for "eventual consistency"
- Don't create separate API calls when data can be batched in one transaction
- Don't use console.log - use `debug()` or `log()`

## Key Dependencies

- Node.js 20+
- React 19
- Next.js 16
- Supabase (PostgreSQL)
- Firebase (Auth, Storage)
- Tailwind CSS
- Jest (testing)
- Playwright (E2E testing)
