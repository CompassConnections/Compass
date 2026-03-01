module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.spec.ts'],

  moduleNameMapper: {
    '^api/(.*)$': '<rootDir>/../api/src/$1',
    '^shared/(.*)$': '<rootDir>/src/$1',
    '^common/(.*)$': '<rootDir>/../../common/src/$1',
    '^email/(.*)$': '<rootDir>/../email/emails/$1',
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        diagnostics: false,
      },
    ],
  },

  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  silent: true,
}
