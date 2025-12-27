module.exports = {
    testEnvironment: 'jsdom',
    testTimeout: 30000, // Increased timeout to 30 seconds
    verbose: true,
    testEnvironmentOptions: {
        url: 'http://localhost',
    },
    // Force tests to run in band (sequentially)
    maxWorkers: 1,
    maxConcurrency: 1,
    // Use fake timers by default for all tests
    timers: 'modern',
    // Reset mocks between tests
    resetMocks: true,
    // Clear mock calls between tests
    clearMocks: true,

    // Setup files to run before tests
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Module name mapping for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1',
        '^@helpers/(.*)$': '<rootDir>/tests/helpers/$1',
        '^@fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
    },

    // Test file patterns
    testMatch: ['**/tests/**/*.test.js'],

    // Disable transforms to treat as CommonJS
    transform: {},

    // Enable fake timers for better control over time-based tests
    timers: 'modern',

    // Run tests in band to avoid parallel execution issues
    maxWorkers: 1,
    maxConcurrency: 1,

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/main.js', // Exclude main entry point
        '!**/node_modules/**',
        '!**/tests/**',
    ],

    // Test environment options for jsdom
    testEnvironmentOptions: {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable',
    },

    // Increase timeout for async tests
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true,
};
