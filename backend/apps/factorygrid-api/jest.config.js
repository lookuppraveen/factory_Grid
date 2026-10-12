/** Integration tests run against a real PostgreSQL started by Testcontainers. */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  transform: {
    // 151002: ts-jest notes that nodenext is a hybrid module kind; type checking runs separately via tsc.
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json', diagnostics: { ignoreCodes: [151002] } }],
  },
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
  testTimeout: 60000,
};
