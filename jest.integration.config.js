'use strict'

module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.ts'],
  coverageReporters: ['json', 'lcov', 'text'],
  clearMocks: false,
  coverageThreshold: {
  /* Adjust accordingly when integration testing is phased in. */
    global: {
      statements: 0,
      functions: 0,
      branches: 0,
      lines: 0
    }
  },
  reporters: ['jest-junit', 'default']
}
