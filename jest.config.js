module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/__tests__/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.spec.tsx'],
  collectCoverageFrom: ['<rootDir>/src/__tests__/**/*.tsx'],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/src/main/**/*',
    '<rootDir>/src/domain/**/*',
    '<rootDir>/src/**/index.tsx',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
