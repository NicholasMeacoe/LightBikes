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

    // Fix: Add MeshBasicMaterial to THREE
    if (content.includes('global.THREE') && !content.includes('MeshBasicMaterial')) {
        content = content.replace(
            /(global\.THREE\s*=\s*\{)/,
            '$1\n    MeshBasicMaterial: jest.fn().mockImplementation(() => ({})),'
        );
        modified = true;
    }

    // Fix: renderer with setClearColor
    if (content.match(/renderer:\s*\{[^}]*\}/) && !content.includes('setClearColor')) {
        content = content.replace(/renderer:\s*\{([^}]*)\}/g, (match, props) => {
            if (!props.includes('setClearColor')) {
                return `renderer: {${props}, setClearColor: jest.fn()}`;
            }
            return match;
        });
        modified = true;
    }

    // Fix: Add render method to objects that need it
    if (content.includes('mockComposer') && !content.includes('render:')) {
        content = content.replace(
            /(const mockComposer\s*=\s*\{[^}]*)(}\s*;)/,
            (match, start, end) => {
                if (!start.includes('render:')) {
                    return start + ',\n    render: jest.fn()' + end;
                }
                return match;
            }
        );
        modified = true;
    }

    // Fix: Add initializeAIOpponents to all game references
    if (
        (content.includes('game =') || content.includes('game:')) &&
        !content.includes('initializeAIOpponents')
    ) {
        // Add to game object definitions
        content = content.replace(/(game:\s*\{[^}]*)(}\s*[,;])/g, (match, start, end) => {
            if (!start.includes('initializeAIOpponents')) {
                return start + ',\n        initializeAIOpponents: jest.fn()' + end;
            }
            return match;
        });
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✓ Fixed ${filename}`);
        fixed++;
    }
});

console.log(`\nFixed ${fixed} files`);
