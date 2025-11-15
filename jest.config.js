/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^common/(.*)$': '<rootDir>/common/$1',
    '^backend/(.*)$': '<rootDir>/backend/$1',
  },
  testMatch: ['**/*.unit.test.ts'],
};