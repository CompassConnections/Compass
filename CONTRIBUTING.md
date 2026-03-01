# Contributing to Compass

Thank you for your interest in contributing to Compass! This document provides comprehensive guidelines for contributing to this open-source project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Documentation](#documentation)
- [Questions and Support](#questions-and-support)

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** 20.x or later
- **Yarn** 1.x (classic)
- **Git**
- **Docker** (optional, for isolated development)

### Fork and Clone

1. Fork the [repository](https://github.com/CompassConnections/Compass) on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/Compass.git
   cd Compass
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/CompassConnections/Compass.git
   ```

### Install Dependencies

```bash
yarn install --frozen-lockfile
```

## Development Environment

### Running the Development Server

```bash
yarn dev
```

Visit http://localhost:3000 to see the application.

### Isolated Development (Recommended)

For full isolation with local Supabase and Firebase emulators:

```bash
yarn dev:isolated
```

Benefits:

- No conflicts with other contributors
- Works offline
- Faster database queries
- Free to reset and reseed data

Requirements:

- Docker (~500MB)
- Supabase CLI
- Java 21+ (for Firebase emulators)
- Firebase CLI

See the [README](./README.md) for detailed setup instructions.

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch

# Run E2E tests
yarn test:e2e
```

### Linting and Type Checking

```bash
# Lint all packages
yarn lint

# Fix linting issues
yarn lint-fix

# Type check all packages
yarn typecheck
```

## Project Structure

This is a Yarn workspaces monorepo with the following packages:

```
Compass/
├── web/                    # Next.js web application
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and services
│   ├── pages/              # Next.js pages
│   └── messages/           # Internationalization files
├── backend/
│   ├── api/                # Express API server
│   ├── shared/             # Shared backend utilities
│   ├── email/              # React email templates
│   └── scripts/            # Database migration scripts
├── common/                 # Shared TypeScript types and utilities
├── supabase/               # Database migrations and config
├── android/                # Capacitor Android app
└── docs/                   # Project documentation
```

### Key Technologies

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | Next.js 14, React 18, TypeScript |
| Styling  | Tailwind CSS                     |
| Backend  | Express.js, Node.js              |
| Database | PostgreSQL (Supabase)            |
| Auth     | Firebase Auth                    |
| Storage  | Firebase Storage                 |
| Mobile   | Capacitor (Android)              |
| Testing  | Jest, Playwright                 |

## Coding Standards

### TypeScript

- Use strict TypeScript typing
- Avoid `any` type; use `unknown` when necessary
- Prefer interfaces over types for object shapes
- Use `const` assertions where appropriate

### React Components

- Use functional components with hooks
- Name components after their file name
- Export primary component at the top of the file
- Use composition over inheritance
- Keep components small and focused

Example component structure:

```tsx
import clsx from 'clsx'
import {useState} from 'react'

interface ProfileCardProps {
  name: string
  age: number
  onSelect?: (id: string) => void
  className?: string
}

export function ProfileCard({name, age, onSelect, className}: ProfileCardProps) {
  const [selected, setSelected] = useState(false)

  const handleClick = () => {
    setSelected(!selected)
    onSelect?.(name)
  }

  return (
    <div className={clsx('card', selected && 'selected', className)}>
      <h3>
        {name}, {age}
      </h3>
      <button onClick={handleClick}>Select</button>
    </div>
  )
}
```

### Naming Conventions

- **Files**: kebab-case (`profile-card.tsx`)
- **Components**: PascalCase (`ProfileCard`)
- **Hooks**: camelCase with `use` prefix (`useUserProfile`)
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Interfaces**: PascalCase

### Import Order

Run `yarn lint-fix` to automatically sort imports:

1. External libraries (React, Next.js, etc.)
2. Internal packages (`common/`, `shared/`)
3. Relative imports (`../`, `./`)
4. Type imports

### Error Handling

- Use try-catch for async operations
- Create custom error types for API errors
- Implement error boundaries for React components
- Log errors with appropriate context

Example:

```typescript
import {APIError} from './errors'

try {
  const result = await api('endpoint', params)
  return result
} catch (err) {
  if (err instanceof APIError) {
    logger.error('API error', {status: err.status, message: err.message})
  } else {
    logger.error('Unexpected error', err)
  }
  throw err
}
```

### Accessibility

- Use semantic HTML elements
- Include ARIA labels where appropriate
- Ensure keyboard navigation works
- Use the `SkipLink` component for main content
- Announce dynamic content changes with `useLiveRegion`

```tsx
import {useLiveRegion} from 'web/components/live-region'

function MyComponent() {
  const {announce} = useLiveRegion()

  const handleAction = () => {
    // Action completed
    announce('Action successful', 'polite')
  }
}
```

## Making Changes

### Creating a Branch

Never work directly on `main`. Create a new branch:

```bash
git checkout -b type/short-description
```

Branch types:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Adding/updating tests
- `chore/` - Maintenance tasks

### Making Commits

Keep commits atomic and descriptive:

```bash
git add .
git commit -m "feat(profiles): add compatibility score display

- Added compatibility score calculation
- Display score on profile cards
- Added tests for scoring algorithm"
```

See [Commit Message Guidelines](#commit-message-guidelines) for details.

### Keeping Your Fork Updated

```bash
# Fetch latest from upstream
git fetch upstream

# Update main branch
git checkout main
git merge upstream/main

# Rebase your feature branch
git checkout feat/your-feature
git rebase main
```

## Testing

### Writing Tests

#### Unit Tests

Place tests in `tests/unit/` within each package:

```typescript
// web/tests/unit/my-function.test.ts
import {myFunction} from '../my-function'

describe('myFunction', () => {
  it('should return correct output', () => {
    expect(myFunction('input')).toBe('expected')
  })
})
```

#### Integration Tests

Place in `tests/integration/`:

```typescript
// web/tests/integration/api.test.ts
import {render, screen} from '@testing-library/react'
import {MyComponent} from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

#### E2E Tests

Place in `tests/e2e/` at the root:

```typescript
// tests/e2e/web/specs/onboarding.spec.ts
import {test, expect} from '@playwright/test'

test('onboarding flow', async ({page}) => {
  await page.goto('/signup')
  await page.fill('[name="email"]', 'test@example.com')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/onboarding')
})
```

### Running Specific Tests

```bash
# Run unit tests for web
yarn workspace web test

# Run tests matching pattern
yarn test --testPathPattern="profile"

# Run E2E tests
yarn test:e2e
```

### Test Coverage

Aim for meaningful test coverage. Focus on:

- Business logic
- User interactions
- Error handling
- Edge cases

## Pull Request Guidelines

### Before Submitting

1. **Run all tests**: `yarn test`
2. **Run linter**: `yarn lint`
3. **Run type check**: `yarn typecheck`
4. **Update documentation** if needed
5. **Rebase on main** if necessary

### Pull Request Format

**Title**: Clear, descriptive title

**Description**:

```markdown
## Summary

Brief description of changes

## Changes

- Added compatibility score to profile cards
- Updated search algorithm for better results

## Testing

- Added unit tests for scoring algorithm
- Tested manually with synthetic data

## Screenshots (if UI changes)
```

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.log statements (except debugging)
- [ ] No debug code left behind

### Review Process

1. Maintainers review within 48 hours
2. Address feedback promptly
3. Do not open new PRs for changes - update existing one
4. Squash commits before merging

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### Examples

```text
feat(profiles): add compatibility scoring algorithm
fix(api): handle rate limiting gracefully
docs(readme): update installation instructions
refactor(auth): simplify token refresh logic
test(profiles): add unit tests for scoring
```

## Documentation

### Updating Documentation

- Update relevant README files
- Add JSDoc comments to complex functions
- Update the `/docs` folder for architectural changes

### API Documentation

API docs are auto-generated and available at:

- Production: https://api.compassmeet.com
- Local: http://localhost:3001 (when running locally)

## Questions and Support

- **Discord**: https://discord.gg/8Vd7jzqjun
- **Email**: hello@compassmeet.com
- **GitHub Issues**: For bug reports and feature requests

---

Thank you for contributing to Compass! Together we're building a platform for meaningful connections.
