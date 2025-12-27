#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const testDir = 'tests/unit';
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));

let fixed = 0;

files.forEach((filename) => {
    const filepath = path.join(testDir, filename);
    let content = fs.readFileSync(filepath, 'utf8');

    // Add SphereGeometry to global.THREE if it exists and doesn't have it
    if (content.includes('global.THREE') && !content.includes('SphereGeometry')) {
        // Find the global.THREE assignment
        const threePattern = /(global\.THREE\s*=\s*\{[^}]+)(}\s*;)/;
        const match = content.match(threePattern);

        if (match) {
            const replacement =
                match[1] +
                ",\n    SphereGeometry: jest.fn().mockImplementation(() => ({ type: 'SphereGeometry' }))" +
                match[2];
            content = content.replace(threePattern, replacement);
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✓ Fixed ${filename}`);
            fixed++;
        }
    }
});

console.log(`\nFixed ${fixed} files`);
