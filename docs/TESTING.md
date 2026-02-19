# Testing

### Why we test

Testing exists to give us fast, reliable feedback about real behavior so we can ship with confidence.

- Prevent regressions: Lock in correct behavior so future changes don’t silently break working features.
- Enable safe refactoring: A trustworthy suite lets us improve design without fear.
- Document intent: Tests act as living examples of how modules and components are expected to work.
- Catch edge cases early: Exercise unhappy paths, timeouts, and integration boundaries before production.
- Increase release confidence: Unit/integration tests plus a few critical E2E flows gate deployments.

What testing is not

- Not a replacement for monitoring, logging, or manual exploratory testing.
- Not a quest for 100% coverage—optimize for meaningful scenarios over raw numbers.

How we apply it here

- Unit and integration tests live in each package and run with Jest (see `jest.config.js`).
- Critical user journeys are covered by Playwright E2E tests under `tests/e2e` (see `playwright.config.ts`).

### Test types at a glance

This project uses three complementary test types. Use the right level for the job:

- Unit tests
    - Purpose: Verify a single function/module in isolation; fast, deterministic.
    - Where: Each package under `tests/unit` (e.g., `backend/api/tests/unit`, `web/tests/unit`, `common/tests/unit`,
      etc.).
    - Runner: Jest (configured via root `jest.config.js`).
    - Naming: `*.unit.test.ts` (or `.tsx` for React in `web`).
    - When to use: Pure logic, utilities, hooks, reducers, small components with mocked dependencies.

- Integration tests
    - Purpose: Verify multiple units working together (e.g., function + DB/client, component + context/provider) without
      spinning up the full app.
    - Where: Each package under `tests/integration` (e.g., `backend/shared/tests/integration`, `web/tests/integration`).
    - Runner: Jest (configured via root `jest.config.js`).
    - Naming: `*.integration.test.ts` (or `.tsx` for React in `web`).
    - When to use: Boundaries between modules, real serialization/parsing, API handlers with mocked network/DB,
      component trees with providers.

- End-to-End (E2E) tests
    - Purpose: Validate real user flows across the full stack.
    - Where: Top-level `tests/e2e` with separate areas for `web` and `backend`.
    - Runner: Playwright (see root `playwright.config.ts`, `testDir: ./tests/e2e`).
    - Naming: `*.e2e.spec.ts`.
    - When to use: Critical journeys (signup, login, checkout), cross-service interactions, smoke tests for deployments.

Quick commands

```bash
# Jest (unit + integration)
yarn test

# Playwright (E2E)
yarn test:e2e
```

### Where to put test files

```filetree
# Config
jest.config.js (for unit and integration tests)
playwright.config.ts (for e2e tests)

# Top-level End-to-End (Playwright)
tests/
├── e2e/
│   ├── web/
│   │   ├── pages/
│   │   └── specs/
│   │       └── example.e2e.spec.ts
│   └── backend/
│       └── specs/
│           └── api.e2e.spec.ts
└── reports/
    └── playwright-report/

# Package-level Unit & Integration (Jest)
backend/
├── api/
│   ├── src/
│   └── tests/
│       ├── unit/
│       │   └── example.unit.test.ts
│       └── integration/
│           └── example.integration.test.ts
├── email/
│   └── tests/
│       ├── unit/
│       └── integration/
└── shared/
    └── tests/
        ├── unit/
        └── integration/

common/
└── tests/
    ├── unit/
    │   └── example.unit.test.ts
    └── integration/
        └── example.integration.test.ts

web/
└── tests/
    ├── unit/
    │   └── example.unit.test.tsx
    └── integration/
        └── example.integration.test.tsx
```

- End-to-End tests live under `tests/e2e` and are executed by Playwright. The root `playwright.config.ts` sets `testDir`
  to `./tests/e2e`.
- Unit and integration tests live in each package’s `tests` folder and are executed by Jest via the root
  `jest.config.js` projects array.
- Naming:
    - Unit: `*.unit.test.ts` (or `.tsx` for React in `web`)
    - Integration: `*.integration.test.ts`
    - E2E (Playwright): `*.e2e.spec.ts`

### Best Practices

- Test Behavior, Not Implementation. Don’t test internal state or function calls unless you’re testing utilities or very
  critical behavior.
- Use msw to Mock APIs. Don't manually mock fetch—use msw to simulate realistic behavior, including network delays and
  errors.
- Don’t Overuse Snapshots. Snapshots are fragile and often meaningless unless used sparingly (e.g., for JSON response
  schemas).
- Prefer userEvent Over fireEvent. It simulates real user interactions more accurately.
- Avoid Testing Next.js Internals . You don’t need to test getStaticProps, getServerSideProps themselves-test what they
  render.
- Don't test just for coverage. Test to prevent regressions, document intent, and handle edge cases.
- Don't write end-to-end tests for features that change frequently unless absolutely necessary.

### Jest Unit Testing Guide

This guide provides guidelines and best practices for writing unit tests using Jest in this project. Following these
standards ensures consistency, maintainability, and comprehensive test coverage.

#### Best Practices

1. Isolate a function route - Each test should focus on one thing that can affect the function outcome
2. Keep tests independent - Tests should not rely on the execution order
3. Use meaningful assertions - Assert that functions are called, what they are called with and the results
4. Avoid testing implementation details - Focus on behavior and outputs
5. Mock external dependencies - Isolate the unit being tested

#### Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test path/to/test.unit.test.ts
```

#### Test Standards

- Test file names should convey what to expect
    - Follow the pattern: `<exact-filename>.[unit,integration].test.ts`. Examples:
        - filename.unit.test.ts
        - filename.integration.test.ts
- Group related tests using describe blocks
- Use descriptive test names that explain the expected behavior.
    - Follow the pattern: "should `expected behavior` [relevant modifier]". Examples:
        - should `ban user` [with matching user id]
        - should `ban user` [with matching user name]

#### Mocking

Mocking means replacing a real dependency (like a module, function, API client, timer, or browser API) with a
controllable test double so your test can run quickly and deterministically, without calling the real thing. In unit
tests we use mocks to isolate the unit under test; in integration tests we selectively mock only the expensive or
unstable edges (e.g., network, filesystem) while exercising real collaborations.

What to mock vs not to mock

- Mock: network/HTTP calls, databases/ORM clients, email/SMS providers, time and randomness (`Date`, timers,
  `Math.random`), browser APIs that are hard to reproduce in Node (e.g., `localStorage`, `IntersectionObserver`).
- Prefer real: pure functions, small utilities, reducers/selectors, simple components; let their real logic run so tests
  actually verify behavior.
- Don’t over-mock: If you mock everything, you only test your mocks. Keep integration tests that hit real boundaries
  inside the process.

Common test doubles

- Stub: a function that returns a fixed value (no assertions on how it was used).
- Spy: records how a function was called (calls count/args); may optionally change behavior.
- Mock: a spy with expectations about how it must be called; in Jest, `jest.fn()` and `jest.spyOn()` produce mock
  functions you can assert on.
- Fake: a lightweight in-memory implementation (e.g., an in-memory repo) used instead of the real service.

Jest quick reference

- Module mock: `jest.mock('path/to/module')` to replace all exports with mock functions. Control behavior with
  `(exportedFn as jest.Mock).mockReturnValue(...)` or `.mockResolvedValue(...)` for async.
- Function mock: `const fn = jest.fn()`; set behavior with `.mockReturnValue`, `.mockImplementation`.
- Spy on existing method: `const spy = jest.spyOn(obj, 'method')` and optionally `spy.mockImplementation(...)`.
- Timers/time: `jest.useFakeTimers(); jest.setSystemTime(new Date('2024-01-01'));` and advance with
  `jest.advanceTimersByTime(ms)`; finally `jest.useRealTimers()`.
- Clearing: `jest.clearAllMocks()` (between tests) vs `jest.resetAllMocks()` (reset implementations) vs
  `jest.restoreAllMocks()` (restore spied originals).

When writing mocks, assert both outcome and interaction:

- Outcome: what your function returned or what side-effect occurred.
- Interaction: that dependencies were called the expected number of times and with the right arguments.

Why mocking is important?

- _Isolation_ - Test your code independently of databases, APIs, and external systems. Tests only fail when your code
  breaks, not when a server is down.
- _Speed_ - Mocked tests run in milliseconds vs. seconds for real network/database calls. Run your suite constantly
  without waiting.
- _Control_ - Easily simulate edge cases like API errors, timeouts, or rare conditions that are difficult to reproduce
  with real systems.
- _Reliability_ - Eliminate unpredictable failures from network issues, rate limits, or changing external data. Same
  inputs = same results, every time.
- _Focus_ - Verify your function's logic and how it uses its dependencies, without requiring those dependencies to
  actually work yet.

###### Use `jest.mock()`

Jest automatically hoists all `jest.mock()` calls to the top of the file before imports are evaluated. To maintain
clarity and align with best practices, explicitly place `jest.mock()` calls at the very top of the file.

Modules mocked this way automatically return `undefined`, which is useful for simplifying tests. If a module or
function’s return value isn’t used, there’s no need to mock it further.

```tsx
//Function and module mocks
jest.mock('path/to/module')

//Function and module imports
import {functionUnderTest} from 'path/to/function'
import {module} from 'path/to/module'

describe('functionUnderTest', () => {
  //Setup
  beforeEach(() => {
    //Run before each test
    jest.resetAllMocks() // Resets any mocks from previous tests
  })
  afterEach(() => {
    //Run after each test
    jest.restoreAllMocks() // Cleans up between tests
  })

  describe('when given valid input', () => {
    it('should describe what is being tested', async () => {
      //Arrange: Setup test data
      const mockData = 'test'

      //Act: Execute the function under test
      const result = myFunction(mockData)

      //Assert: Verify the result
      expect(result).toBe('expected')
    })
  })

  describe('when an error occurs', () => {
    //Test cases for errors
  })
})
```

###### Modules

When mocking modules it's important to verify what was returned if applicable, the amount of times said module was called and what it was called with.

```tsx
//functionFile.ts
import {module as mockedDep} from 'path/to/module'

export const functionUnderTest = async (param) => {
  return await mockedDep(param)
}
```

```tsx
//testFile.unit.test.ts
import {functionUnderTest} from 'path/to/function'
import {module as mockedDep} from 'path/to/module'
jest.mock('path/to/module')

/**
 * Inside the test case
 * We create a mock for any information passed into the function that is being tested
 * and if the function returns a result we create a mock to test the result
 */
const mockParam = 'mockParam'
const mockReturnValue = 'mockModuleValue'

/**
 * use .mockResolvedValue when handling async/await modules that return values
 * use .mockReturnValue when handling non async/await modules that return values
 */
describe('functionUnderTest', () => {
  it('returns mocked module value and calls dependency correctly', async () => {
    ;(mockedDep as jest.Mock).mockResolvedValue(mockReturnValue)

    const result = await functionUnderTest(mockParam)

    expect(result).toBe(mockReturnValue)
    expect(mockedDep).toHaveBeenCalledTimes(1)
    expect(mockedDep).toHaveBeenCalledWith(mockParam)
  })
})
```

Use namespace imports when you want to import everything a module exports under a single name.

```tsx
//moduleFile.ts
export const module = async (param) => {
  const value = 'module'
  return value
}

export const moduleTwo = async (param) => {
  const value = 'moduleTwo'
  return value
}
```

```tsx
//functionFile.ts
import {module, moduleTwo} from 'path/to/module'

export const functionUnderTest = async (param) => {
  const mockValue = await moduleTwo(param)
  const returnValue = await module(mockValue)
  return returnValue
}
```

```tsx
//testFile.unit.test.ts
jest.mock('path/to/module')

/**
 * This creates an object containing all named exports from ./path/to/module
 */
import * as mockModule from 'path/to/module'

;(mockModule.module as jest.Mock).mockResolvedValue(mockReturnValue)
```

When mocking modules, you can use `jest.spyOn()` instead of `jest.mock()`.

- `jest.mock()` mocks the entire module, which is ideal for external dependencies like Axios or database clients.
- `jest.spyOn()` mocks specific methods while keeping the real implementation for others. It can also be used to observe how a real method is called without changing its behavior.
    - also replaces the need to have `jest.mock()` at the top of the file.

```tsx
//testFile.unit.test.ts
import * as mockModule from 'path/to/module'

//Mocking the return value of the module
jest.spyOn(mockModule, 'module').mockResolvedValue(mockReturnValue)

//Spying on the module to check functionality
jest.spyOn(mockModule, 'module')

//You can assert the module functionality with both of the above exactly like you would if you used jest.mock()
expect(mockModule.module).toBeCalledTimes(1)
expect(mockModule.module).toBeCalledWith(mockParam)
```

###### Dependencies

Mocking dependencies allows you to test `your code’s` logic in isolation, without relying on third-party services or external functionality.

```tsx
//functionFile.ts
import {dependency} from 'path/to/dependency'

export const functionUnderTest = async (param) => {
  const depen = await dependency()
  const value = depen.module()

  return value
}
```

```tsx
//testFile.unit.test.ts
jest.mock('path/to/dependency')

import {dependency} from 'path/to/dependency'

describe('functionUnderTest', () => {
  /**
   * Because the dependency has modules that are used we need to
   * create a variable outside of scope that can be asserted on
   */
  let mockDependency = {} as any
  beforeEach(() => {
    mockDependency = {
      module: jest.fn(),
    }
    jest.resetAllMocks() // Resets any mocks from previous tests
  })
  afterEach(() => {
    //Run after each test
    jest.restoreAllMocks() // Cleans up between tests
  })

  //Inside the test case
  ;(mockDependency.module as jest.Mock).mockResolvedValue(mockReturnValue)

  expect(mockDependency.module).toBeCalledTimes(1)
  expect(mockDependency.module).toBeCalledWith(mockParam)
})
```

###### Error checking

```tsx
//function.ts
const result = await functionName(param)

if (!result) {
  throw new Error(403, 'Error text', error)
}
```

```tsx
//testFile.unit.test.ts
const mockParam = {} as any

//This will check only the error message
expect(functionName(mockParam)).rejects.toThrowError('Error text')

//This will check the complete error
try {
  await functionName(mockParam)
  fail('Should have thrown')
} catch (error) {
  const functionError = error as Error
  expect(functionError.code).toBe(403)
  expect(functionError.message).toBe('Error text')
  expect(functionError.details).toBe(mockParam)
  expect(functionError.name).toBe('Error')
}
```

```tsx
//For console.error types
console.error('Error message', error)

//Use spyOn to mock
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

expect(errorSpy).toHaveBeenCalledWith(
  'Error message',
  expect.objectContaining({name: 'Error'}), //The error 'name' refers to the error type
)
```

###### Mocking array return value

```tsx
//arrayFile.ts
const exampleArray = [1, 2, 3, 4, 5]

const arrayResult = exampleArray.includes(2)
```

```tsx
//testFile.unit.test.ts

//This will mock 'includes' for all arrays and force the return value to be true
jest.spyOn(Array.prototype, 'includes').mockReturnValue(true)

// ---
//This will specify which 'includes' array to mock based on the args passed into the .includes()
jest.spyOn(Array.prototype, 'includes').mockImplementation(function (value) {
  if (value === 2) {
    return true
  }
  return false
})
```

# Playwright (E2E) Testing Guide

E2E tests use [Playwright](https://playwright.dev/) and run against a fully isolated local stack:

- **Supabase** (Postgres) via `npx supabase start`
- **Firebase** (Auth and Storage) via `firebase emulators:start`
- **Backend API** (`backend/api`)
- **Next.js frontend** (`web`)

Tests live in `tests/e2e/` and follow the `*.e2e.spec.ts` naming convention.

---

## Prerequisites

Make sure you have these installed:

```bash
# Supabase CLI
npm install -g supabase

# Firebase CLI
npm install -g firebase-tools

# Java 21+ (required for Firebase emulators)
java -version  # Must be 21+

# Docker (for Supabase)
docker --version
```

---

## Quick Start

### Option A: Full Clean Run (CI-style)

Starts everything from scratch, seeds the database, and runs all tests.
Use this the first time, after schema changes, or to reproduce CI failures.

```bash
yarn test:e2e
```

This will:

1. Kill any stale Firebase/Supabase processes
2. Start Supabase and apply migrations
3. Start Firebase emulators
4. Seed test data
5. Start backend API and Next.js
6. Run all Playwright tests
7. Clean up everything on exit

### Option B: Dev Mode (Fast Iteration)

Use this while writing or debugging tests to open Playwright UI (recommended for development).

```bash
yarn test:e2e:ui
```

If you don't like the UI, you can run specific tests in your terminal. Assumes services are already running.

```bash
# Run all e2e tests
yarn test:e2e:dev

# Run a specific test file
yarn test:e2e:dev tests/e2e/web/specs/signUp.spec.ts

# Run tests matching a pattern
yarn test:e2e:dev --grep "login"

# Debug a specific test step by step
yarn test:e2e:dev --debug tests/e2e/web/specs/signUp.spec.ts
```

> **Note:** `yarn test:e2e:dev` will fail with a helpful message if any required service is not running.

---

## Recommended Dev Workflow

### 1. Start services once

```bash
yarn test:e2e:services
```

This starts Firebase emulators, the backend API, and Next.js in one terminal.
In a separate terminal, start Supabase:

```bash
yarn test:db:reset  # Restart and apply migrations + seed
```

### 2. Open Playwright UI

```bash
yarn test:e2e:ui
```

This opens a visual browser interface where you can:

- ▶️ Run individual tests with one click
- 🔍 See step-by-step execution
- 📸 View screenshots and videos on failure
- 🔄 Re-run tests without restarting anything
- 🕵️ Time-travel debug through test steps

### 3. Edit tests and re-run

Edit your `*.e2e.spec.ts` file, save, then click **Run** in the Playwright UI.
No restart needed for test file changes.

### 4. Reset data when needed

If your tests leave dirty state or you need a fresh DB:

```bash
yarn test:db:reset  # Drops and re-applies all migrations + seed
```

---

## What Needs a Restart vs Not

| Change                        | Action needed                            |
|-------------------------------|------------------------------------------|
| Edit test file                | Just re-run in Playwright UI             |
| Edit app code (Next.js)       | Next.js hot reloads automatically        |
| Edit API code                 | API dev server hot reloads automatically |
| Database schema change        | `yarn test:db:reset`                     |
| Seed data change              | `yarn test:db:reset`                     |
| Change `playwright.config.ts` | Restart Playwright UI                    |
| Change env variables          | Restart affected service                 |

---

## Environment

E2E tests run against local emulators with these defaults (set in `.env.test`):

| Service          | Local URL                                                 |
|------------------|-----------------------------------------------------------|
| Supabase API     | `http://127.0.0.1:54321`                                  |
| Supabase DB      | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio  | `http://127.0.0.1:54323` (browse data visually)           |
| Firebase Studio  | `http://127.0.0.1:4000` (browse data visually)            |
| Firebase Auth    | `http://127.0.0.1:9099`                                   |
| Firebase Storage | `http://127.0.0.1:9199`                                   |
| Backend API      | `http://localhost:8088`                                   |
| Next.js          | `http://localhost:3000`                                   |

### Viewing test data

Open Supabase Studio while tests are running to inspect the database:

```
http://127.0.0.1:54323
```

Or connect via psql:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## Writing Tests

Tests live in `tests/e2e/` and follow this structure:

```
tests/
└── e2e/
    ├── web/
    │   └── specs/
    │       └── auth.e2e.spec.ts
    └── backend/
        └── specs/
            └── api.e2e.spec.ts
```

### Component Selection Hierarchy

Use this priority order for selecting elements in Playwright tests:

1. Prefer `getByRole()` — use semantic roles that reflect how users interact

   ```typescript
   await page.getByRole('button', {name: 'Submit'}).click()
   ```

   If a meaningful ARIA role is not available, fall back to accessible text selectors (next point).

2. Use accessible text selectors — when roles don't apply, target user-facing text

   ```typescript
   await page.getByLabel('Email').fill('user@example.com')
   await page.getByPlaceholder('Enter your name').fill('John')
   await page.getByText('Welcome back').isVisible()
   ```

3. Only use `data-testid` — when elements have no stable user-facing text
   ```typescript
   // For icons, toggles, or dynamic content without text
   await page.getByTestId('menu-toggle').click()
   await page.getByTestId('loading-spinner').isVisible()
   ```

This hierarchy mirrors how users actually interact with your application, making tests more reliable and meaningful.

### Example test

```typescript
import {test, expect} from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({page}) => {
    await page.goto('/')
    await page.getByRole('button', {name: 'Sign In'}).click()
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', {name: 'Login'}).click()

    await expect(page.getByText('Welcome')).toBeVisible()
  })
})
```

### Test accounts

These are seeded automatically by `yarn test:db:seed`:

| Email               | Password      |
|---------------------|---------------|
| `test1@example.com` | `password123` |
| `test2@example.com` | `password123` |

---

## Troubleshooting

### Port already in use

```bash
# Supabase port conflict
supabase stop --no-backup
supabase start

# Firebase port conflict
pkill -f "firebase emulators"; pkill -f "java.*emulator"
yarn emulate
```

### Supabase won't stop (permission denied)

This happens with snap-installed Docker. Use native Docker instead:

```bash
sudo snap remove docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in
```

### Tests fail with "service not running"

```bash
# Check what's running
supabase status
curl http://127.0.0.1:9099  # Firebase Auth
curl http://localhost:8088/health  # Backend API
curl http://localhost:3000  # Next.js
```

### Database is in a bad state

```bash
yarn test:db:reset  # Full reset - drops everything and reseeds
```

### Firebase auth warning in CI

```
⚠ You are not currently authenticated
```

This is safe to ignore for emulators. They don't connect to real Firebase.

### Multiple emulator instances warning

```
⚠ It seems that you are running multiple instances of the emulator suite
```

Kill stale processes:

```bash
pkill -f "firebase emulators"; pkill -f "java.*emulator"
sleep 2
yarn emulate
```

---

## CI

E2E tests run automatically on every PR and push to `main` via `.github/workflows/e2e-tests.yml`.

The CI workflow:

- Uses `supabase/setup-cli@v1` for the Supabase CLI
- Uses Java 21 for Firebase emulators
- Runs `yarn test:e2e` (same script as local)
- Uploads Playwright reports as artifacts on failure

To download the Playwright report from a failed CI run:

1. Go to the GitHub Actions run
2. Click **Artifacts** at the bottom
3. Download `playwright-report`
4. Open `index.html` in your browser
