module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.spec.ts'],

  moduleNameMapper: {
    '^api/(.*)$': '<rootDir>/src/$1',
    '^shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^common/(.*)$': '<rootDir>/../../common/src/$1',
    '^email/(.*)$': '<rootDir>/../email/emails/$1',
  },

  moduleFileExtensions: ['tsx', 'ts', 'js', 'json'],
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
