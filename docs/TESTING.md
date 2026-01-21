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

* Test Behavior, Not Implementation. Don’t test internal state or function calls unless you’re testing utilities or very
  critical behavior.
* Use msw to Mock APIs. Don't manually mock fetch—use msw to simulate realistic behavior, including network delays and
  errors.
* Don’t Overuse Snapshots. Snapshots are fragile and often meaningless unless used sparingly (e.g., for JSON response
  schemas).
* Prefer userEvent Over fireEvent. It simulates real user interactions more accurately.
* Avoid Testing Next.js Internals . You don’t need to test getStaticProps, getServerSideProps themselves-test what they
  render.
* Don't test just for coverage. Test to prevent regressions, document intent, and handle edge cases.
* Don't write end-to-end tests for features that change frequently unless absolutely necessary.

### Jest Unit Testing Guide

This guide provides guidelines and best practices for writing unit tests using Jest in this project. Following these
standards ensures consistency, maintainability, and comprehensive test coverage.

#### Best Practices

1. Isolate a function route  - Each test should focus on one thing that can affect the function outcome
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
- *Isolation* - Test your code independently of databases, APIs, and external systems. Tests only fail when your code breaks, not when a server is down.
- *Speed* - Mocked tests run in milliseconds vs. seconds for real network/database calls. Run your suite constantly without waiting.
- *Control* - Easily simulate edge cases like API errors, timeouts, or rare conditions that are difficult to reproduce with real systems.
- *Reliability* - Eliminate unpredictable failures from network issues, rate limits, or changing external data. Same inputs = same results, every time.
- *Focus* - Verify your function's logic and how it uses its dependencies, without requiring those dependencies to actually work yet.

###### Use `jest.mock()`

Jest automatically hoists all `jest.mock()` calls to the top of the file before imports are evaluated. To maintain
clarity and align with best practices, explicitly place `jest.mock()` calls at the very top of the file.

Modules mocked this way automatically return `undefined`, which is useful for simplifying tests. If a module or
function’s return value isn’t used, there’s no need to mock it further.

```tsx
//Function and module mocks
jest.mock('path/to/module');

//Function and module imports
import {functionUnderTest} from "path/to/function"
import {module} from "path/to/module"

describe('functionUnderTest', () => {
  //Setup
  beforeEach(() => {
    //Run before each test
    jest.resetAllMocks(); // Resets any mocks from previous tests
  });
  afterEach(() => {
    //Run after each test
    jest.restoreAllMocks(); // Cleans up between tests
  });

  describe('when given valid input', () => {
    it('should describe what is being tested', async () => {
      //Arrange: Setup test data
      const mockData = 'test';

      //Act: Execute the function under test
      const result = myFunction(mockData);

      //Assert: Verify the result
      expect(result).toBe('expected');
    });
  });

  describe('when an error occurs', () => {
    //Test cases for errors
  });
});
```

###### Modules

When mocking modules it's important to verify what was returned if applicable, the amount of times said module was called and what it was called with.

```tsx
//functionFile.ts
import { module as mockedDep } from "path/to/module"

export const functionUnderTest = async (param) => {
    return await mockedDep(param);
};
```

```tsx
//testFile.unit.test.ts
import { functionUnderTest } from "path/to/function";
import { module as mockedDep } from "path/to/module";
jest.mock('path/to/module');

/**
 * Inside the test case
 * We create a mock for any information passed into the function that is being tested
 * and if the function returns a result we create a mock to test the result
 */
const mockParam = "mockParam"
const mockReturnValue = "mockModuleValue"

/**
 * use .mockResolvedValue when handling async/await modules that return values
 * use .mockReturnValue when handling non async/await modules that return values
 */
(module as jest.Mock).mockResolvedValue(mockReturnValue);

const result = await functionUnderTest(mockParam);

expect(result).toBe(mockReturnValue);
expect(module).toBeCalledTimes(1);
expect(module).toBeCalledWith(mockParam);
```

Use namespace imports when you want to import everything a module exports under a single name.

```tsx
//moduleFile.ts
export const module = async (param) => {
    const value = "module"
    return value
};

export const moduleTwo = async (param) => {
    const value = "moduleTwo"
    return value
};
```
```tsx
//functionFile.ts
import { module, moduleTwo } from "path/to/module"

export const functionUnderTest = async (param) => {
    const mockValue = await moduleTwo(param)
    const returnValue = await module(mockValue)
    return returnValue;
};
```
```tsx
//testFile.unit.test.ts
jest.mock('path/to/module');

/**
 * This creates an object containing all named exports from ./path/to/module
 */
import * as mockModule from "path/to/module"

(mockModule.module as jest.Mock).mockResolvedValue(mockReturnValue);
```
When mocking modules, you can use `jest.spyOn()` instead of `jest.mock()`.

- `jest.mock()` mocks the entire module, which is ideal for external dependencies like Axios or database clients.
- `jest.spyOn()` mocks specific methods while keeping the real implementation for others. It can also be used to observe how a real method is called without changing its behavior.
    - also replaces the need to have `jest.mock()` at the top of the file.

```tsx
//testFile.unit.test.ts
import * as mockModule from "path/to/module"

//Mocking the return value of the module
jest.spyOn(mockModule, 'module').mockResolvedValue(mockReturnValue);

//Spying on the module to check functionality
jest.spyOn(mockModule, 'module');

//You can assert the module functionality with both of the above exactly like you would if you used jest.mock()
expect(mockModule.module).toBeCalledTimes(1);
expect(mockModule.module).toBeCalledWith(mockParam);
```
###### Dependencies

Mocking dependencies allows you to test `your code’s` logic in isolation, without relying on third-party services or external functionality.

```tsx
//functionFile.ts
import { dependency } from "path/to/dependency"

export const functionUnderTest = async (param) => {
    const depen = await dependency();
    const value = depen.module();

    return value;
};
```
```tsx
//testFile.unit.test.ts
jest.mock('path/to/dependency');

import { dependency } from "path/to/dependency"

describe('functionUnderTest', () => {
    /**
     * Because the dependency has modules that are used we need to 
     * create a variable outside of scope that can be asserted on
     */
    let mockDependency = {} as any;
    beforeEach(() => {
        mockDependency = {
            module: jest.fn(),
        };
        jest.resetAllMocks(); // Resets any mocks from previous tests
    });
    afterEach(() => {
        //Run after each test
        jest.restoreAllMocks(); // Cleans up between tests
    });

    //Inside the test case
    (mockDependency.module as jest.Mock).mockResolvedValue(mockReturnValue);

    expect(mockDependency.module).toBeCalledTimes(1);
    expect(mockDependency.module).toBeCalledWith(mockParam);
});
```

###### Error checking

```tsx
//function.ts
const result = await functionName(param);

if (!result) {
    throw new Error (403, 'Error text', error);
};
```

```tsx
//testFile.unit.test.ts
const mockParam = {} as any;

//This will check only the error message
expect(functionName(mockParam))
    .rejects
    .toThrowError('Error text');

//This will check the complete error
try {
    await functionName(mockParam);
    fail('Should have thrown');
} catch (error) {
    const functionError = error as Error;
    expect(functionError.code).toBe(403);
  expect(functionError.message).toBe('Error text');
    expect(functionError.details).toBe(mockParam);
    expect(functionError.name).toBe('Error');
}
```

```tsx
//For console.error types
console.error('Error message', error);

//Use spyOn to mock
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

expect(errorSpy).toHaveBeenCalledWith(
    'Error message',
    expect.objectContaining({name: 'Error'}) //The error 'name' refers to the error type
);

```

###### Mocking array return value

```tsx
//arrayFile.ts
const exampleArray = [ 1, 2, 3, 4, 5 ];

const arrayResult = exampleArray.includes(2);
```

```tsx
//testFile.unit.test.ts

//This will mock 'includes' for all arrays and force the return value to be true
jest.spyOn(Array.prototype, 'includes').mockReturnValue(true);

// ---
//This will specify which 'includes' array to mock based on the args passed into the .includes()
jest.spyOn(Array.prototype, 'includes').mockImplementation(function(value) {
  if (value === 2) {
    return true;
  }
  return false;
});
```

### Playwright (E2E) Testing Guide

TODO