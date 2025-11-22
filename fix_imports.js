const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const testsDir = path.join(__dirname, 'tests/unit');

// 1. Map all files in src
const fileMap = new Map();

function scanSrc(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanSrc(fullPath);
        } else if (file.endsWith('.js')) {
            // Store relative path from src, e.g., 'multiplayer/PlayerEntity.js'
            // Key is the filename, e.g., 'PlayerEntity.js'
            const relativePath = path.relative(srcDir, fullPath);
            fileMap.set(file, relativePath);
        }
    }
}

scanSrc(srcDir);
console.log(`Found ${fileMap.size} source files.`);

// 2. Update tests
function updateTests(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            updateTests(fullPath);
        } else if (file.endsWith('.test.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Regex to find requires
            // Matches: require('./Something.js') or require('../Something.js')
            // We want to capture the filename
            content = content.replace(/require\(['"](\.?\.?\/)([^'"]+)['"]\)/g, (match, prefix, importPath) => {
                const filename = path.basename(importPath);

                // If we have this file in our map
                if (fileMap.has(filename)) {
                    const newPath = `@/${fileMap.get(filename)}`;
                    if (match !== `require('${newPath}')`) {
                        changed = true;
                        return `require('${newPath}')`;
                    }
                }
                return match;
            });

            if (changed) {
                console.log(`Updating ${file}...`);
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

updateTests(testsDir);
console.log('Done updating imports.');
