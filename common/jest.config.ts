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
}
