#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const testDir = 'tests/unit';
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));

let fixed = 0;

files.forEach((filename) => {
    const filepath = path.join(testDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    // Fix: Add missing beforeEach DOM cleanup
    if (content.includes('document.body') && !content.includes("document.body.innerHTML = ''")) {
        // Add DOM cleanup to beforeEach blocks
        content = content.replace(
            /(beforeEach\(\(\) => \{)/g,
            "$1\n        document.body.innerHTML = '';"
        );
        modified = true;
    }

    // Fix: Add missing socket.io-client mock for NetworkManager tests
    if (filename.includes('Network') && !content.includes("jest.mock('socket.io-client')")) {
        const socketMock = `
jest.mock('socket.io-client', () => {
    return jest.fn(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        disconnect: jest.fn(),
        connected: false
    }));
});

`;
        content = socketMock + content;
        modified = true;
    }

    // Fix: Add missing fadeOut/fadeIn mocks for MusicPlayer
    if (
        content.includes('musicPlayer') &&
        content.includes('fadeOut') &&
        !content.includes('fadeOut: jest.fn()')
    ) {
        content = content.replace(
            /(const musicPlayer\s*=\s*\{[^}]*)(}\s*;)/,
            (match, start, end) => {
                if (!start.includes('fadeOut:')) {
                    return (
                        start +
                        ',\n    fadeOut: jest.fn().mockResolvedValue(true),\n    fadeIn: jest.fn().mockResolvedValue(true)' +
                        end
                    );
                }
                return match;
            }
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✓ Fixed ${filename}`);
        fixed++;
    }
});

console.log(`\nFixed ${fixed} files`);
