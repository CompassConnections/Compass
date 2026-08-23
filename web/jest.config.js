module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.spec.ts'],

  moduleNameMapper: {
    '^api/(.*)$': '<rootDir>/src/$1',
    '^shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^common/(.*)$': '<rootDir>/../common/src/$1',
    '^web/(.*)$': '<rootDir>/$1',
    // marked ships ESM only; point Jest, which runs CJS here, at its UMD build.
    '^marked$': '<rootDir>/node_modules/marked/lib/marked.umd.js',
    '^email/(.*)$': '<rootDir>/../email/emails/$1',
  },

  // 'tsx' so a test can import a component directly — `tests/unit/qr-code.test.ts` renders one to
  // assert the geometry its scannability depends on. testMatch is still *.test.ts, so this only
  // widens resolution, it does not pick up new test files.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  clearMocks: true,

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  silent: true,
  // Each ts-jest worker is a full TS-compiling process; the default (cpus - 1) can spawn enough
  // of them in parallel to exhaust memory on high-core-count machines. CI runners only have a
  // couple of cores, so throttling there just makes the suite slower without saving any memory.
  ...(process.env.CI ? {} : {maxWorkers: '50%', workerIdleMemoryLimit: '512MB'}),
}
