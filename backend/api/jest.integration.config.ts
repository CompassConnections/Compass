// Real-Postgres tests. Run them through `yarn test:integration`, which rebuilds the database first.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.config.ts has no ES exports
const base = require('./jest.config')

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/integration/**/*.integration.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/tests/integration/helpers/env.ts'],
  // Every test truncates the one shared database, so files must not run in parallel.
  maxWorkers: 1,
  // createSupabaseDirectClient() starts a metrics interval that nothing can clear.
  forceExit: true,
}
