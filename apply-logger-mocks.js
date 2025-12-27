#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const LOGGER_MOCK = `const mockLogger = {
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
}));

`;

const testDir = 'tests/unit';
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));

files.forEach((filename) => {
    const filepath = path.join(testDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    if (content.includes('MockLoggerClass')) {
        return; // Skip if already has proper mock
    }

    // Remove any incomplete/old logger mocks
    content = content.replace(
        /const mockLogger = \{[\s\S]*?jest\.mock\(['"]@\/utils\/Logger\.js['"][\s\S]*?\}\);?\s*/g,
        ''
    );

    // Find the first line that's not a comment or empty
    const lines = content.split('\n');
    let insertIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (
            line.startsWith('/**') ||
            line.startsWith('*') ||
            line.startsWith('//') ||
            line === ''
        ) {
            continue;
        }
        insertIndex = i;
        break;
    }

    lines.splice(insertIndex, 0, LOGGER_MOCK);
    content = lines.join('\n');

    // Fix console spies
    content = content.replace(
        /const consoleSpy = jest\.spyOn\(console, ['"]log['"]\)\.mockImplementation\(\);?\s*/g,
        ''
    );
    content = content.replace(
        /const consoleSpy = jest\.spyOn\(console, ['"]warn['"]\)\.mockImplementation\(\);?\s*/g,
        ''
    );
    content = content.replace(
        /const consoleSpy = jest\.spyOn\(console, ['"]error['"]\)\.mockImplementation\(\);?\s*/g,
        ''
    );
    content = content.replace(
        /const consoleSpy = jest\.spyOn\(console, ['"]debug['"]\)\.mockImplementation\(\);?\s*/g,
        ''
    );
    content = content.replace(
        /const consoleSpy = jest\.spyOn\(console, ['"]info['"]\)\.mockImplementation\(\);?\s*/g,
        ''
    );
    content = content.replace(/consoleSpy\.mockRestore\(\);?\s*/g, '');

    // Replace console method calls
    content = content.replace(
        /expect\(console\.log\)\.toHaveBeenCalled/g,
        'expect(mockLogger.info).toHaveBeenCalled'
    );
    content = content.replace(
        /expect\(console\.warn\)\.toHaveBeenCalled/g,
        'expect(mockLogger.warn).toHaveBeenCalled'
    );
    content = content.replace(
        /expect\(console\.error\)\.toHaveBeenCalled/g,
        'expect(mockLogger.error).toHaveBeenCalled'
    );
    content = content.replace(
        /expect\(console\.debug\)\.toHaveBeenCalled/g,
        'expect(mockLogger.debug).toHaveBeenCalled'
    );
    content = content.replace(
        /expect\(console\.info\)\.toHaveBeenCalled/g,
        'expect(mockLogger.info).toHaveBeenCalled'
    );
    content = content.replace(
        /expect\(consoleSpy\)\.toHaveBeenCalled/g,
        'expect(mockLogger.warn).toHaveBeenCalled'
    );

    fs.writeFileSync(filepath, content, 'utf8');
});

console.log('Applied logger mocks to all test files');
