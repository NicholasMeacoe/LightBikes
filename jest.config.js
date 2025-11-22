module.exports = {
    testEnvironment: 'jsdom',

    // Setup files to run before tests
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Module name mapping for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Test file patterns
    testMatch: ['**/tests/**/*.test.js'],

    // Disable transforms to treat as CommonJS
    transform: {},

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/main.js', // Exclude main entry point
        '!**/node_modules/**',
        '!**/tests/**'
    ],

    // Test environment options for jsdom
    testEnvironmentOptions: {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
    },

    // Increase timeout for async tests
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true
};
