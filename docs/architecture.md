# Architecture Documentation

> [!WARNING]
> This document is a work in progress. Please help us improve it!

## System Overview

Compass is a monorepo containing a Next.js web application, Express API server, Capacitor Android app, and shared packages. The platform is designed for forming deep, authentic 1-on-1 connections.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Next.js   │  │   Static    │  │    API Routes           │ │
│  │   Web App   │  │   Assets    │  │    (Serverless)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Google Cloud Platform (Backend)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Express   │  │   WebSocket │  │    Docker Container     │ │
│  │   API       │  │   Server    │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Connection
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Database  │  │   Edge      │  │    Realtime             │ │
│  │   (Postgres)│  │   Functions │  │    Subscriptions        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Firebase                                    │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Auth      │  │   Storage   │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
Compass/
├── web/                    # Next.js web application
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & services
│   ├── pages/              # Next.js pages
│   ├── messages/           # i18n translations
│   └── tests/              # Unit & integration tests
│
├── backend/
│   ├── api/                # Express REST API
│   │   ├── src/           # Handler implementations
│   │   └── tests/         # Unit tests
│   ├── shared/             # Shared backend utilities
│   │   ├── src/
│   │   │   ├── supabase/  # Database utilities
│   │   │   ├── monitoring/ # Logging
│   │   │   └── mobile/     # Push notifications
│   │   └── tests/
│   ├── email/              # React email templates
│   └── scripts/            # Database migrations
│
├── common/                 # Shared types & utilities
│   └── src/
│       ├── types/          # TypeScript definitions
│       ├── api/            # API schema definitions
│       └── constants/      # App constants
│
├── supabase/              # Database migrations
│   └── migrations/
│
├── android/               # Capacitor Android app
│
└── tests/                 # E2E tests (Playwright)
    └── e2e/
```

## Technology Stack

### Frontend (web)

| Category   | Technology            | Version |
| ---------- | --------------------- | ------- |
| Framework  | Next.js               | 14.1.0  |
| UI Library | React                 | 18.2.0  |
| Language   | TypeScript            | 5.5.4   |
| Styling    | Tailwind CSS          | 3.3.3   |
| State      | React Context + Hooks | -       |
| Forms      | React Hook Form       | 7.65.0  |
| Rich Text  | TipTap                | 2.10.4  |
| i18n       | Custom JSON           | -       |
| Testing    | Jest                  | 29.3.1  |
| E2E        | Playwright            | 1.58.2  |

### Backend (api)

| Category   | Technology | Version |
| ---------- | ---------- | ------- |
| Runtime    | Node.js    | 20+     |
| Framework  | Express    | 5.0.0   |
| Language   | TypeScript | 5.5.4   |
| Database   | PostgreSQL | -       |
| ORM        | pg-promise | -       |
| Validation | Zod        | -       |
| WebSocket  | ws         | -       |
| Testing    | Jest       | 29.3.1  |

### Infrastructure

| Service          | Purpose             |
| ---------------- | ------------------- |
| Vercel           | Frontend hosting    |
| Google Cloud     | Backend hosting     |
| Supabase         | PostgreSQL database |
| Firebase Auth    | User authentication |
| Firebase Storage | Media storage       |
| PostHog          | Analytics           |

## Data Flow

### User Request Flow

```
1. User clicks button
       │
       ▼
2. React component handles event
       │
       ▼
3. useAPIGetter/useMutation hook called
       │
       ▼
4. API client sends HTTP request
       │
       ▼
5. Express API receives request
       │
       ▼
6. Auth middleware validates token
       │
       ▼
7. Handler processes request
       │
       ▼
8. Database query executed
       │
       ▼
9. Response returned to client
       │
       ▼
10. React state updated, UI re-renders
```

### Authentication Flow

```
User Sign-In:
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────┐
│  Client  │───▶│ Firebase │───▶│  Auth Token  │───▶│  Backend   │
└──────────┘    └──────────┘    │  (JWT)       │    │  Validates │
                                └──────────────┘    └────────────┘
                                                              │
                                                              ▼
                                                       ┌────────────┐
                                                       │  Session   │
                                                       │  Created   │
                                                       └────────────┘
```

## Database Schema

### Key Tables

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP
)
-- Profile information
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  name TEXT,
  age INTEGER,
  bio TEXT,
  -- many more fields
)
-- Private user data
private_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  email TEXT,
  notification_settings JSONB
)
-- Messages
private_user_messages (
  id UUID PRIMARY KEY,
  from_user_id UUID,
  to_user_id UUID,
  content TEXT,
  created_at TIMESTAMP
)
```

See `supabase/migrations/` for full schema.

## API Design

### REST Principles

- Resource-based URLs: `/get-profiles`, `/create-profile`
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (delete)
- JSON request/response format
- Authentication via Bearer tokens

### Endpoint Structure

```
/{action}  POST  - Perform action
```

### Request Format

```typescript
{
  // Endpoint-specific parameters
}
```

### Response Format

```typescript
// Success
{
  // Response data
}

// Error
{
  error: {
    status: 400,
    message: "Error description"
  }
}
```

## State Management

### Frontend State

1. **Server State**: React Query-style hooks (`useAPIGetter`, `useMutation`)
2. **Client State**: React `useState`, `useReducer`
3. **Persisted State**: `usePersistentLocalState`, `usePersistentInMemoryState`
4. **Global State**: React Context (`AuthProvider`, `I18nProvider`)

### State Persistence

```typescript
// In-memory (lost on refresh)
const [state, setState] = useState(initialValue)

// Local storage (persists)
const [state, setState] = usePersistentLocalState(initialValue, 'key')

// Session storage (persists until tab closed)
const [state, setState] = usePersistentInMemoryState(initialValue, 'key')
```

## Security

### Authentication

- Firebase Auth for user authentication
- JWT tokens for API requests
- Session-based auth for web

### Authorization

- Role-based access (user, moderator, admin)
- User ID verification on protected endpoints

### Data Protection

- Row-level security in PostgreSQL
- Environment-based secrets
- Input validation with Zod

## Performance Optimizations

### Frontend

- Next.js static generation for public pages
- Image optimization with `next/image`
- Code splitting per route
- Memoization with `useMemo`, `useCallback`
- Virtualized lists for large datasets

### Backend

- Database connection pooling
- Query optimization (indexes)
- Caching strategies
- Rate limiting

## Monitoring

### Logging

- Structured logging with context
- Different log levels: debug, info, warn, error
- Environment-aware (development vs production)

### Error Tracking

- Error boundaries in React
- API error handling
- Server-side error logging

### Analytics

- PostHog for user analytics
- Custom event tracking

## Deployment

### CI/CD Pipeline

```
GitHub Push
     │
     ▼
┌─────────────┐
│  CI Tests   │ ──▶ Lint, TypeCheck, Unit Tests
└─────────────┘
     │
     ▼
┌─────────────┐
│  CD Deploy  │ ──▶ Vercel (Web), GCP (API)
└─────────────┘
```

### Environments

| Environment | URL             | Purpose           |
| ----------- | --------------- | ----------------- |
| Development | localhost       | Local development |
| Staging     | -               | Testing changes   |
| Production  | compassmeet.com | Live users        |

## Development Workflow

1. **Create branch**: `feat/description`
2. **Make changes**: Implement feature/fix
3. **Test locally**: `yarn dev`
4. **Run tests**: `yarn test`
5. **Submit PR**: Code review
6. **Merge**: Automated deployment

## See Also

- [Knowledge Base](knowledge.md)
- [Development Guide](development.md)
- [Testing Guide](TESTING.md)
- [Next.js Documentation](Next.js.md)
