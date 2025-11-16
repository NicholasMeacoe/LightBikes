#!/usr/bin/env node

/**
 * Music Asset Setup Script
 * 
 * This script sets up placeholder music files for development and testing.
 * In a production environment, these would be replaced with actual music tracks.
 */

const fs = require('fs');
const path = require('path');

// Configuration for placeholder music files
const MUSIC_ASSETS = {
    'ambient-space.mp3': {
        description: 'Calm, atmospheric background music for focused gameplay',
        fallback: '../engine.mp3',
        energyLevel: 'ambient'
    },
    'cyber-pulse.mp3': {
        description: 'Energetic electronic beats matching the cyberpunk aesthetic',
        fallback: '../victory.mp3',
        energyLevel: 'upbeat'
    },
    'neon-rush.mp3': {
        description: 'High-intensity music for competitive and fast-paced gameplay',
        fallback: '../explosion.mp3',
        energyLevel: 'intense'
    }
};

/**
 * Check if music files exist and create symbolic links to fallbacks if needed
 */
function setupMusicAssets() {
    const musicDir = __dirname;
    let assetsCreated = 0;
    let assetsExisting = 0;
    
    console.log('Setting up music assets...');
    console.log(`Music directory: ${musicDir}`);
    
    for (const [filename, config] of Object.entries(MUSIC_ASSETS)) {
        const filePath = path.join(musicDir, filename);
        const fallbackPath = path.join(musicDir, config.fallback);
        
        // Check if the actual music file exists
        if (fs.existsSync(filePath)) {
            console.log(`✓ ${filename} already exists`);
            assetsExisting++;
            continue;
        }
        
        // Check if fallback file exists
        if (fs.existsSync(fallbackPath)) {
            try {
                // Create symbolic link to fallback file for development
                fs.symlinkSync(config.fallback, filePath);
                console.log(`→ Created symbolic link: ${filename} -> ${config.fallback}`);
                assetsCreated++;
            } catch (error) {
                if (error.code === 'EEXIST') {
                    console.log(`✓ ${filename} link already exists`);
                    assetsExisting++;
                } else {
                    console.warn(`⚠ Failed to create link for ${filename}:`, error.message);
                    console.log(`  Fallback will be used automatically by the music system`);
                }
            }
        } else {
            console.warn(`⚠ Fallback file not found: ${fallbackPath}`);
            console.log(`  Music system will gracefully handle missing ${filename}`);
        }
    }
    
    console.log('\nMusic asset setup complete:');
    console.log(`  ${assetsExisting} files already existed`);
    console.log(`  ${assetsCreated} placeholder links created`);
    console.log(`  Music system will use fallbacks for missing files`);
    
    if (assetsCreated > 0) {
        console.log('\nNote: Placeholder links use existing sound effects.');
        console.log('Replace with actual music files for production use.');
    }
}

/**
 * Clean up placeholder links
 */
function cleanupPlaceholders() {
    const musicDir = __dirname;
    let cleaned = 0;
    
    console.log('Cleaning up placeholder music assets...');
    
    for (const filename of Object.keys(MUSIC_ASSETS)) {
        const filePath = path.join(musicDir, filename);
        
        try {
            const stats = fs.lstatSync(filePath);
            if (stats.isSymbolicLink()) {
                fs.unlinkSync(filePath);
                console.log(`✓ Removed placeholder link: ${filename}`);
                cleaned++;
            } else {
                console.log(`✓ Kept actual file: ${filename}`);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn(`⚠ Error checking ${filename}:`, error.message);
            }
        }
    }
    
    console.log(`\nCleanup complete: ${cleaned} placeholder links removed`);
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'setup':
            setupMusicAssets();
            break;
        case 'cleanup':
            cleanupPlaceholders();
            break;
        case 'status':
            console.log('Music asset status:');
            for (const [filename, config] of Object.entries(MUSIC_ASSETS)) {
                const filePath = path.join(__dirname, filename);
                if (fs.existsSync(filePath)) {
                    try {
                        const stats = fs.lstatSync(filePath);
                        if (stats.isSymbolicLink()) {
                            const target = fs.readlinkSync(filePath);
                            console.log(`${filename}: placeholder link -> ${target}`);
                        } else {
                            console.log(`${filename}: actual file (${Math.round(stats.size / 1024)}KB)`);
                        }
                    } catch (error) {
                        console.log(`${filename}: error reading file`);
                    }
                } else {
                    console.log(`${filename}: missing (will use fallback: ${config.fallback})`);
                }
            }
            break;
        default:
            console.log('Music Asset Setup Script');
            console.log('');
            console.log('Usage:');
            console.log('  node setup-music-assets.js setup   - Create placeholder music files');
            console.log('  node setup-music-assets.js cleanup - Remove placeholder files');
            console.log('  node setup-music-assets.js status  - Show current asset status');
            console.log('');
            console.log('This script helps manage music assets during development.');
            console.log('Placeholder files use existing sound effects as temporary music.');
    }
}

module.exports = {
    setupMusicAssets,
    cleanupPlaceholders,
    MUSIC_ASSETS
};