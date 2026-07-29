import {readFileSync} from 'fs'
import {pathsToModuleNameMapper} from 'ts-jest'

const {compilerOptions} = JSON.parse(readFileSync('./tsconfig.json', 'utf-8'))

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  silent: true,
  // Each ts-jest worker is a full TS-compiling process; the default (cpus - 1) can spawn enough
  // of them in parallel to exhaust memory on high-core-count machines.
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
}
