#!/usr/bin/env node
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('tests/unit/*.test.js');

const correctMockPattern = `const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
};

const MockLoggerClass = jest.fn().mockImplementation(() => mockLogger);
MockLoggerClass.create = jest.fn((namespace) => mockLogger);

jest.mock('@/utils/Logger.js', () => ({
    Logger: MockLoggerClass,
    logger: mockLogger,
    createLogger: jest.fn(() => mockLogger)
}));`;

files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');

    // Check if file has Logger mock
    if (!content.includes('jest.mock') || !content.includes('Logger')) {
        return;
    }

    // Find existing Logger mock pattern
    const mockPattern = /const mockLogger = \{[\s\S]*?\}\);/;
    const match = content.match(mockPattern);

    if (match && !content.includes('MockLoggerClass')) {
        content = content.replace(mockPattern, correctMockPattern);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    }
});

console.log('Done!');
