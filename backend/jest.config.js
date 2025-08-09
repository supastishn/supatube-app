module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  testEnvironment: 'node',
  testTimeout: 45000,
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/setup-tests.js'],
};
