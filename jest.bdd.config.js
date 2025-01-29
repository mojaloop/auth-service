'use strict'

const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig')

module.exports = {
  testTimeout: 30000,
  maxWorkers: '50%',
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.ts'],
  coverageReporters: ['json', 'lcov', 'text'],
  clearMocks: false,
  coverageThreshold: {
    global: {
      statements: 20,
      functions: 19,
      branches: 5,
      lines: 20
    }
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  }),
  reporters: ['jest-junit', 'default']
}
