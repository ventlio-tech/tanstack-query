module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/__tests__/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.spec.ts'],
  collectCoverageFrom: ['<rootDir>/src/__tests__/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/main/**/*',
    '<rootDir>/src/domain/**/*',
    '<rootDir>/src/**/index.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
