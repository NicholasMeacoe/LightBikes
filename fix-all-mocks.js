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

    // Fix 1: scene: {} -> scene: { traverse: jest.fn() }
    if (content.match(/scene:\s*\{\s*\}/)) {
        content = content.replace(/scene:\s*\{\s*\}/g, 'scene: { traverse: jest.fn() }');
        modified = true;
    }

    // Fix 2: renderer: {} -> renderer: { setClearColor: jest.fn() }
    if (content.match(/renderer:\s*\{\s*\}/)) {
        content = content.replace(/renderer:\s*\{\s*\}/g, 'renderer: { setClearColor: jest.fn() }');
        modified = true;
    }

    // Fix 3: Add SphereGeometry to THREE if missing
    if (content.includes('global.THREE = {') && !content.includes('SphereGeometry')) {
        content = content.replace(
            /(global\.THREE\s*=\s*\{)/,
            '$1\n    SphereGeometry: jest.fn().mockImplementation(() => ({})),'
        );
        modified = true;
    }

    // Fix 4: Add MeshLambertMaterial to THREE if missing
    if (content.includes('global.THREE = {') && !content.includes('MeshLambertMaterial')) {
        content = content.replace(
            /(global\.THREE\s*=\s*\{)/,
            '$1\n    MeshLambertMaterial: jest.fn().mockImplementation(() => ({})),'
        );
        modified = true;
    }

    // Fix 5: Remove userAgent redefinition (causes errors)
    if (content.includes("Object.defineProperty(navigator, 'userAgent'")) {
        content = content.replace(
            /Object\.defineProperty\(navigator,\s*'userAgent'[^}]+\}\);?\s*/g,
            '// userAgent mock removed - causes errors\n'
        );
        modified = true;
    }

    // Fix 6: Add initializeAIOpponents to game mocks
    if (content.includes('mockGame') && !content.includes('initializeAIOpponents')) {
        content = content.replace(/(const mockGame\s*=\s*\{[^}]*)(}\s*;)/, (match, start, end) => {
            if (!start.includes('initializeAIOpponents')) {
                return start + ',\n    initializeAIOpponents: jest.fn()' + end;
            }
            return match;
        });
        modified = true;
    }

    // Fix 7: Add executeRecoveryStrategy to errorHandler mocks
    if (content.includes('mockErrorHandler') && !content.includes('executeRecoveryStrategy')) {
        content = content.replace(
            /(const mockErrorHandler\s*=\s*\{[^}]*)(}\s*;)/,
            (match, start, end) => {
                if (!start.includes('executeRecoveryStrategy')) {
                    return start + ',\n    executeRecoveryStrategy: jest.fn()' + end;
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
