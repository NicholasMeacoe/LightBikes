#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const testDir = 'tests/unit';
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));

let fixed = 0;

files.forEach((filename) => {
    const filepath = path.join(testDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    // Fix renderer: {} to include setClearColor
    const rendererPattern = /renderer:\s*\{\s*\}/g;
    if (rendererPattern.test(content)) {
        content = content.replace(rendererPattern, 'renderer: { setClearColor: jest.fn() }');
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✓ Fixed ${filename}`);
        fixed++;
    }
});

console.log(`\nFixed ${fixed} files`);
