const jest = require('eslint-plugin-jest');
const prettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['node_modules/', 'dist/', 'coverage/', '*.legacy.*'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                // Node.js
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                // Jest
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
            },
        },
        plugins: {
            jest,
        },
        rules: {
            ...jest.configs.recommended.rules,
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'jest/no-conditional-expect': 'warn',
        },
    },
    prettier,
];
