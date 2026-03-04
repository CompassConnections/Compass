# Web Application

The Compass web application built with Next.js, React and TypeScript.

## Overview

This is the frontend of the Compass platform, a transparent platform for forming deep, authentic 1-on-1 connections.

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 3.3.3
- **State Management**: React Context + Custom Hooks
- **Forms**: React Hook Form
- **Rich Text**: TipTap (ProseMirror)
- **Charts**: Recharts
- **i18n**: Custom solution with JSON message files

## Project Structure

```
web/
├── components/            # React components
│   ├── auth-context.tsx   # Authentication state
│   ├── buttons/           # Button components
│   ├── chat/              # Chat/messaging components
│   ├── comments/          # Comment components
│   ├── editor/            # Rich text editor
│   ├── events/            # Event components
│   ├── filters/           # Search filters
│   ├── matches/           # Match components
│   ├── nav/               # Navigation components
│   ├── profile/           # Profile components
│   └── widgets/           # Reusable widgets
├── hooks/                 # Custom React hooks (50+)
├── lib/                   # Utilities and services
│   ├── api.ts             # API client
│   ├── firebase/          # Firebase configuration
│   ├── locale/            # Internationalization
│   ├── service/           # Analytics, push notifications
│   ├── supabase/         # Supabase client
│   └── logger.ts         # Structured logging
├── pages/                # Next.js pages
│   ├── api/              # API routes
│   ├── _app.tsx          # App wrapper
│   ├── _document.tsx     # Document setup
│   └── [username].tsx    # Dynamic routes
├── messages/             # Translation JSON files
├── public/               # Static assets
├── styles/               # Global CSS
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
└── types/                # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- Yarn 1.x

### Installation

```bash
# From root directory
yarn install
```

### Development

```bash
# Run web app with hot reload
yarn dev

# Or from web directory
cd web
yarn serve
```

Visit http://localhost:3000

### Build

```bash
# Production build
yarn build

# Start production server
yarn start
```

### Testing

```bash
# Run tests
yarn test

# Run with coverage
yarn test --coverage

# Watch mode
yarn test --watch
```

### Linting

```bash
# Check lint
yarn lint

# Fix lint issues
yarn lint-fix
```

## Key Concepts

### Components

Components are organized by feature in `/components`. Reusable widgets are in `/components/widgets`.

Example component:

```tsx
// components/profile/profile-card.tsx
import {User} from 'common/src/user'

interface ProfileCardProps {
  user: User
  onLike?: (userId: string) => void
}

export function ProfileCard({user, onLike}: ProfileCardProps) {
  return (
    <div className="profile-card">
      <img src={user.avatarUrl} alt={user.name} />
      <h3>{user.name}</h3>
      <button onClick={() => onLike?.(user.id)}>Like</button>
    </div>
  )
}
```

### Hooks

Use custom hooks for stateful logic. Common hooks:

- `useUser()` - Get current user
- `useAPIGetter()` - Fetch API data with caching
- `useMutation()` - Handle form submissions
- `usePersistentInMemoryState()` - Cache state across pages

```tsx
import {useAPIGetter} from 'web/hooks/use-api-getter'

function ProfileList() {
  const {data, refresh} = useAPIGetter('get-profiles', {})

  if (!data) return <Loading />

  return (
    <div>
      {data.profiles.map((profile) => (
        <ProfileCard key={profile.id} user={profile} />
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

### API Calls

Backend API is called through the `api` helper:

```tsx
import {api} from 'web/lib/api'

// Server-side (getStaticProps, getServerSideProps)
const profiles = await api('get-profiles', {})

// Client-side - use hooks
const {data} = useAPIGetter('get-profiles', {})
```

### Internationalization

Translation files are in `/common/messages` (e.g., `en.json`, `fr.json`).

```tsx
import {useT} from 'web/lib/locale'

function MyComponent() {
  const t = useT()

  return <h1>{t('welcome', 'Welcome to Compass')}</h1>
}
```

### Styling

Tailwind CSS is used for styling. Use utility classes:

```tsx
<div className="flex items-center justify-between p-4 bg-canvas-50 rounded-lg">
  <span className="text-ink-900 font-medium">Content</span>
</div>
```

## Accessibility

The app includes several accessibility features:

### Error Boundary

Catches React errors and shows user-friendly message:

```tsx
import {ErrorBoundary} from 'web/components/error-boundary'

;<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### Live Region

Announces dynamic content changes to screen readers:

```tsx
import {useLiveRegion} from 'web/components/live-region'

const {announce} = useLiveRegion()

// Announce status changes
announce('Profile liked', 'polite')
```

Priority levels:

- `polite` - Waits for screen reader to finish (default)
- `assertive` - Interrupts immediately

### Skip Links

Keyboard users can skip to main content:

```tsx
import {SkipLink, MainContent} from 'web/components/skip-link'

;<>
  <SkipLink />
  <MainContent>...</MainContent>
</>
```

## Logging

Use the structured logger for debug logging that's filtered out in production:

```tsx
import {debug, logApiError} from 'common/logger'

// Simple logging
debug('User logged in', {userId: '123'})

// API errors with context
try {
  await api('endpoint', {})
} catch (err) {
  logApiError('get-profiles', err, {userId: '123'})
}
```

## Environment Variables

Key environment variables for the web app:

| Variable                        | Description           |
| ------------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key     |
| `NEXT_PUBLIC_FIREBASE_API_KEY`  | Firebase API key      |
| `NEXT_PUBLIC_POSTHOG_KEY`       | PostHog analytics key |
| `NEXT_PUBLIC_VERCEL_ENV`        | Vercel environment    |

## Common Tasks

### Adding a New Page

1. Create file in `/pages/`:

```tsx
// pages/new-page.tsx
import {Page} from 'web/components/page-base'

export default function NewPage() {
  return (
    <Page>
      <h1>New Page</h1>
    </Page>
  )
}
```

### Adding a Component

1. Create file in appropriate `/components` subdirectory
2. Export the component
3. Add to parent component

### Adding a Hook

1. Create file in `/hooks/`
2. Follow naming convention:\*.ts`

### Adding Translations

1. Add key to `/messages/fr.json`
2. Add translations to other locale files

## Troubleshooting

### Slow local development

Running `yarn dev:isolated` uses local emulators and is faster.

### Type errors

Run `yarn typecheck` to see all type errors.

### Build failures

Check `yarn lint` first, as linting issues can cause build failures.

## See Also

- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Development Docs](../docs/development.md)
- [Testing Guide](../docs/TESTING.md)
- [Architecture Docs](../docs/knowledge.md)

## Setup

This is the setup for deployment on Vercel, which you only need to do if you create a new platform from scratch, not if
you are contributing to Compass.

Set up a Vercel account and link it to your GitHub repository.

Add the following environment variables and the ones in `.env` in the Vercel dashboard:

```bash
NEXT_PUBLIC_VERCEL=1
```
