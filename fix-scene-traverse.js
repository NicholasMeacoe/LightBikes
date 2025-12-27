#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const testDir = 'tests/unit';
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));

let fixed = 0;

files.forEach((filename) => {
    const filepath = path.join(testDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    // Fix scene: {} to scene: { traverse: jest.fn() }
    const scenePattern = /scene:\s*\{\s*\}/g;
    if (scenePattern.test(content)) {
        content = content.replace(scenePattern, 'scene: { traverse: jest.fn() }');
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✓ Fixed ${filename}`);
        fixed++;
    }
});

console.log(`\nFixed ${fixed} files`);
