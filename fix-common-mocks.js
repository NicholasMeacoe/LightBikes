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

    // Fix 1: Add scene.traverse mock if scene exists but traverse doesn't
    if (
        content.includes('scene:') &&
        content.includes('mockScene') &&
        !content.includes('traverse:')
    ) {
        content = content.replace(/scene:\s*\{([^}]*)\}/g, (match, props) => {
            if (!props.includes('traverse')) {
                return match.replace('}', ', traverse: jest.fn()}');
            }
            return match;
        });
        modified = true;
    }

    // Fix 2: Add THREE.SphereGeometry mock if THREE exists
    if (content.includes('global.THREE') && !content.includes('SphereGeometry')) {
        content = content.replace(/(global\.THREE\s*=\s*\{[^}]*)(}\s*;)/, (match, start, end) => {
            if (!start.includes('SphereGeometry')) {
                return (
                    start +
                    ",\n    SphereGeometry: jest.fn().mockImplementation(() => ({ type: 'SphereGeometry' }))" +
                    end
                );
            }
            return match;
        });
        modified = true;
    }

    // Fix 3: Add renderer.setClearColor if renderer mock exists
    if (content.includes('mockRenderer') && !content.includes('setClearColor')) {
        content = content.replace(/const mockRenderer\s*=\s*\{([^}]*)\}/g, (match, props) => {
            if (!props.includes('setClearColor')) {
                return match.replace('}', ', setClearColor: jest.fn()}');
            }
            return match;
        });
        modified = true;
    }

    // Fix 4: Add THREE.MeshLambertMaterial if THREE exists
    if (content.includes('global.THREE') && !content.includes('MeshLambertMaterial')) {
        content = content.replace(/(global\.THREE\s*=\s*\{[^}]*)(}\s*;)/, (match, start, end) => {
            if (!start.includes('MeshLambertMaterial')) {
                return (
                    start +
                    ",\n    MeshLambertMaterial: jest.fn().mockImplementation(() => ({ type: 'MeshLambertMaterial' }))" +
                    end
                );
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
