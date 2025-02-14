/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['js'],
  testMatch: ['**/__tests__/**/*.js'],
  verbose: true
};